<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
