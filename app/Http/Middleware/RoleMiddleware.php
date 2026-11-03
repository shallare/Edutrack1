<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restreint une route aux rôles listés.
 * Usage : Route::middleware('role:admin') ou 'role:enseignant,admin'
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles, true)) {
            return response()->json(['erreur' => 'Accès non autorisé pour votre rôle.'], 403);
        }

        return $next($request);
    }
}
