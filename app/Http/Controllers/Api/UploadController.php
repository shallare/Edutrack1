<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Upload d'illustrations (schémas dessinés, images collées dans l'éditeur).
 * Les fichiers sont stockés sur disque : la base ne porte plus de base64.
 */
class UploadController extends Controller
{
    public function image(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:png,jpg,jpeg,gif,webp|max:4096', // 4 Mo max
        ]);

        $path = $request->file('image')->store('illustrations', 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
        ], 201);
    }
}
