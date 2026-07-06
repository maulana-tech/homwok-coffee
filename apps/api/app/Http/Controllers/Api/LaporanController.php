<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanBaku;
use App\Models\DetailPembelian;
use App\Models\PemakaianBahan;
use App\Models\Pembelian;
use App\Models\Penjualan;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    /**
     * Laporan penjualan + ringkasan, filter periode ?from=&to=.
     * ?export=excel (CSV) | ?export=pdf mengunduh file.
     */
    public function penjualan(Request $request)
    {
        $rows = $this->penjualanQuery($request)->get();

        $summary = [
            'jumlah_transaksi' => $rows->count(),
            'total_penjualan' => (float) $rows->sum('grand_total'),
            'total_hpp' => (float) $rows->sum('total_hpp'),
            'laba_kotor' => (float) $rows->sum('laba_kotor'),
        ];

        if ($export = $request->query('export')) {
            return $this->export($export, 'laporan-penjualan',
                ['Nomor Nota', 'Tanggal', 'Kasir', 'Penjualan', 'HPP', 'Laba Kotor'],
                $rows->map(fn (Penjualan $p) => [
                    $p->nomor_nota,
                    optional($p->tanggal_jual)->format('Y-m-d H:i'),
                    $p->pegawai?->nama_lengkap,
                    $p->grand_total,
                    $p->total_hpp,
                    $p->laba_kotor,
                ])->all()
            );
        }

        return response()->json(['summary' => $summary, 'data' => $rows]);
    }

    /**
     * Laporan HPP per transaksi + margin.
     */
    public function hpp(Request $request)
    {
        $rows = $this->penjualanQuery($request)->get();

        $data = $rows->map(fn (Penjualan $p) => [
            'nomor_nota' => $p->nomor_nota,
            'tanggal_jual' => $p->tanggal_jual,
            'grand_total' => (float) $p->grand_total,
            'total_hpp' => (float) $p->total_hpp,
            'laba_kotor' => (float) $p->laba_kotor,
            'margin' => $p->grand_total > 0 ? round($p->laba_kotor / $p->grand_total * 100, 1) : 0,
        ]);

        $totalPenjualan = (float) $rows->sum('grand_total');
        $totalHpp = (float) $rows->sum('total_hpp');

        $summary = [
            'total_hpp' => $totalHpp,
            'total_penjualan' => $totalPenjualan,
            'margin_rata' => $totalPenjualan > 0 ? round(($totalPenjualan - $totalHpp) / $totalPenjualan * 100, 1) : 0,
        ];

        if ($export = $request->query('export')) {
            return $this->export($export, 'laporan-hpp',
                ['Nomor Nota', 'Tanggal', 'Penjualan', 'HPP', 'Margin %'],
                $data->map(fn ($d) => [
                    $d['nomor_nota'],
                    (string) $d['tanggal_jual'],
                    $d['grand_total'],
                    $d['total_hpp'],
                    $d['margin'],
                ])->all()
            );
        }

        return response()->json(['summary' => $summary, 'data' => $data]);
    }

    /**
     * Laba-rugi kotor periode.
     */
    public function labaRugi(Request $request)
    {
        $rows = $this->penjualanQuery($request)->get();

        $pendapatan = (float) $rows->sum('grand_total');
        $hpp = (float) $rows->sum('total_hpp');
        $laba = $pendapatan - $hpp;

        $summary = [
            'pendapatan' => $pendapatan,
            'hpp' => $hpp,
            'laba_kotor' => $laba,
            'margin' => $pendapatan > 0 ? round($laba / $pendapatan * 100, 1) : 0,
        ];

        if ($export = $request->query('export')) {
            return $this->export($export, 'laba-rugi',
                ['Keterangan', 'Jumlah'],
                [
                    ['Pendapatan', $pendapatan],
                    ['HPP', $hpp],
                    ['Laba Kotor', $laba],
                ]
            );
        }

        return response()->json($summary);
    }

    /**
     * Laporan pembelian per periode, filter ?from=&to= (atas tanggal_beli).
     * ?export=excel|pdf mengunduh file.
     */
    public function pembelian(Request $request)
    {
        $query = Pembelian::with('pegawai')
            ->withCount('detailPembelian as jumlah_item')
            ->orderBy('tanggal_beli');

        if ($request->filled('from')) {
            $query->whereDate('tanggal_beli', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('tanggal_beli', '<=', $request->query('to'));
        }

        $rows = $query->get();

        $summary = [
            'jumlah_transaksi' => $rows->count(),
            'total_pembelian' => (float) $rows->sum('total_beli'),
            'total_item' => (int) $rows->sum('jumlah_item'),
        ];

        if ($export = $request->query('export')) {
            return $this->export($export, 'laporan-pembelian',
                ['Nomor Pembelian', 'Tanggal', 'Pemasok', 'Jumlah Item', 'Total Beli'],
                $rows->map(fn (Pembelian $p) => [
                    $p->nomor_pembelian,
                    substr((string) $p->tanggal_beli, 0, 10),
                    $p->pemasok,
                    $p->jumlah_item,
                    $p->total_beli,
                ])->all()
            );
        }

        return response()->json(['summary' => $summary, 'data' => $rows]);
    }

    /**
     * Kartu persediaan (kartu stok) metode FIFO untuk satu bahan.
     * Menggabungkan pergerakan MASUK (lot pembelian) dan KELUAR (pemakaian
     * bahan per penjualan) secara kronologis, lalu menghitung saldo berjalan.
     * Param wajib: ?id_bahan=. Opsional: ?from=&to= (tanggal), ?export=.
     */
    public function kartuPersediaan(Request $request)
    {
        $request->validate([
            'id_bahan' => 'required|integer|exists:bahan_baku,id_bahan',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $bahan = BahanBaku::findOrFail($request->query('id_bahan'));

        // MASUK: tiap lot pembelian bahan ini.
        $masuk = DetailPembelian::with('pembelian')
            ->where('id_bahan', $bahan->id_bahan)
            ->get()
            ->map(fn (DetailPembelian $d) => [
                'tanggal' => substr((string) optional($d->pembelian)->tanggal_beli, 0, 10),
                'urut' => 0, // masuk mendahului keluar bila tanggalnya sama
                'referensi' => optional($d->pembelian)->nomor_pembelian,
                'keterangan' => 'Pembelian',
                'masuk_qty' => (float) $d->qty_awal,
                'masuk_harga' => (float) $d->harga_beli,
                'masuk_total' => (float) $d->qty_awal * (float) $d->harga_beli,
                'keluar_qty' => 0.0,
                'keluar_harga' => 0.0,
                'keluar_total' => 0.0,
            ]);

        // KELUAR: tiap pemakaian bahan (biaya = harga lot yang dikonsumsi FIFO).
        $keluar = PemakaianBahan::with('detailPenjualan.penjualan')
            ->where('id_bahan', $bahan->id_bahan)
            ->get()
            ->map(function (PemakaianBahan $p) {
                $jual = optional($p->detailPenjualan)->penjualan;

                return [
                    'tanggal' => substr((string) optional($jual)->tanggal_jual, 0, 10),
                    'urut' => 1,
                    'referensi' => optional($jual)->nomor_nota,
                    'keterangan' => 'Penjualan',
                    'masuk_qty' => 0.0,
                    'masuk_harga' => 0.0,
                    'masuk_total' => 0.0,
                    'keluar_qty' => (float) $p->qty_dipakai,
                    'keluar_harga' => (float) $p->harga_beli,
                    'keluar_total' => (float) $p->subtotal_hpp,
                ];
            });

        $from = $request->query('from');
        $to = $request->query('to');

        $rows = $masuk->concat($keluar)
            ->when($from, fn ($c) => $c->filter(fn ($r) => $r['tanggal'] >= $from))
            ->when($to, fn ($c) => $c->filter(fn ($r) => $r['tanggal'] <= $to))
            ->sortBy([['tanggal', 'asc'], ['urut', 'asc']])
            ->values();

        // Saldo berjalan (qty & nilai).
        $sqty = 0.0;
        $snilai = 0.0;
        $rows = $rows->map(function ($r) use (&$sqty, &$snilai) {
            $sqty += $r['masuk_qty'] - $r['keluar_qty'];
            $snilai += $r['masuk_total'] - $r['keluar_total'];
            $r['saldo_qty'] = round($sqty, 2);
            $r['saldo_nilai'] = round($snilai, 2);

            return $r;
        });

        $summary = [
            'total_masuk_qty' => (float) $rows->sum('masuk_qty'),
            'total_masuk_nilai' => (float) $rows->sum('masuk_total'),
            'total_keluar_qty' => (float) $rows->sum('keluar_qty'),
            'total_keluar_nilai' => (float) $rows->sum('keluar_total'),
            'saldo_qty' => $rows->isNotEmpty() ? $rows->last()['saldo_qty'] : 0.0,
            'saldo_nilai' => $rows->isNotEmpty() ? $rows->last()['saldo_nilai'] : 0.0,
        ];

        if ($export = $request->query('export')) {
            return $this->export($export, 'kartu-persediaan-'.$bahan->nama_bahan,
                ['Tanggal', 'Referensi', 'Keterangan', 'Masuk Qty', 'Masuk Rp', 'Keluar Qty', 'Keluar Rp', 'Saldo Qty', 'Saldo Rp'],
                $rows->map(fn ($r) => [
                    $r['tanggal'],
                    $r['referensi'],
                    $r['keterangan'],
                    $r['masuk_qty'] ?: '',
                    $r['masuk_total'] ?: '',
                    $r['keluar_qty'] ?: '',
                    $r['keluar_total'] ?: '',
                    $r['saldo_qty'],
                    $r['saldo_nilai'],
                ])->all()
            );
        }

        return response()->json([
            'bahan' => [
                'id_bahan' => $bahan->id_bahan,
                'nama_bahan' => $bahan->nama_bahan,
                'satuan' => $bahan->satuan,
            ],
            'summary' => $summary,
            'data' => $rows,
        ]);
    }

    private function penjualanQuery(Request $request)
    {
        $query = Penjualan::with('pegawai')->orderBy('tanggal_jual');

        if ($request->filled('from')) {
            $query->whereDate('tanggal_jual', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('tanggal_jual', '<=', $request->query('to'));
        }

        return $query;
    }

    /**
     * Export tabel sebagai CSV (export=excel) atau PDF (export=pdf).
     *
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, mixed>>  $rows
     */
    private function export(string $type, string $filename, array $headers, array $rows)
    {
        if ($type === 'pdf') {
            $html = '<h2 style="font-family:sans-serif">'.e($filename).'</h2>'
                .'<table border="1" cellspacing="0" cellpadding="6" '
                .'style="border-collapse:collapse;font-family:sans-serif;font-size:12px">';
            $html .= '<tr>'.collect($headers)->map(fn ($h) => '<th>'.e($h).'</th>')->implode('').'</tr>';
            foreach ($rows as $row) {
                $html .= '<tr>'.collect($row)->map(fn ($c) => '<td>'.e((string) $c).'</td>')->implode('').'</tr>';
            }
            $html .= '</table>';

            return \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->download($filename.'.pdf');
        }

        // Default: CSV (dapat dibuka di Excel)
        return new StreamedResponse(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'.csv"',
        ]);
    }
}
