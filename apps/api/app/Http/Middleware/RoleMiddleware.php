<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Ensure the authenticated pegawai has one of the allowed roles.
     *
     * Usage in routes: ->middleware('role:manager') or 'role:barista,manager'
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->peran, $roles, true)) {
            abort(403, 'Anda tidak memiliki akses');
        }

        return $next($request);
    }
}
