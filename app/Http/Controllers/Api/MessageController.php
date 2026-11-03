<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Utilisateur;
use Illuminate\Http\Request;

/**
 * Messagerie 1-à-1 entre étudiants/délégués.
 * Le frontend interroge la conversation en polling (pas de websocket requis).
 */
class MessageController extends Controller
{
    /** Vérifie que l'interlocuteur est bien un étudiant/délégué différent de soi. */
    private function interlocuteur(Request $request, $id): ?Utilisateur
    {
        if ((int) $id === $request->user()->id) return null;

        return Utilisateur::whereIn('role', ['etudiant', 'delegue'])->find($id);
    }

    // Conversation avec un camarade (100 derniers messages) + marquage lu
    public function conversation(Request $request, $id)
    {
        $moi = $request->user();
        $autre = $this->interlocuteur($request, $id);
        if (!$autre) {
            return response()->json(['erreur' => 'Interlocuteur introuvable.'], 404);
        }

        // Les messages reçus de ce camarade sont maintenant lus
        Message::where('expediteur_id', $autre->id)
            ->where('destinataire_id', $moi->id)
            ->whereNull('lu_le')
            ->update(['lu_le' => now()]);

        $messages = Message::where(function ($q) use ($moi, $autre) {
                $q->where('expediteur_id', $moi->id)->where('destinataire_id', $autre->id);
            })
            ->orWhere(function ($q) use ($moi, $autre) {
                $q->where('expediteur_id', $autre->id)->where('destinataire_id', $moi->id);
            })
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'contenu'    => $m->contenu,
                'de_moi'     => $m->expediteur_id === $moi->id,
                'created_at' => $m->created_at,
            ]);

        return response()->json($messages);
    }

    // Envoyer un message à un camarade
    public function envoyer(Request $request, $id)
    {
        $autre = $this->interlocuteur($request, $id);
        if (!$autre) {
            return response()->json(['erreur' => 'Interlocuteur introuvable.'], 404);
        }

        $validated = $request->validate([
            'contenu' => 'required|string|max:2000',
        ]);

        $message = Message::create([
            'expediteur_id'   => $request->user()->id,
            'destinataire_id' => $autre->id,
            'contenu'         => $validated['contenu'],
        ]);

        return response()->json([
            'message' => [
                'id'         => $message->id,
                'contenu'    => $message->contenu,
                'de_moi'     => true,
                'created_at' => $message->created_at,
            ],
        ], 201);
    }

    // Nombre de messages non lus, groupés par expéditeur (badges de la liste)
    public function nonLus(Request $request)
    {
        $compteurs = Message::where('destinataire_id', $request->user()->id)
            ->whereNull('lu_le')
            ->selectRaw('expediteur_id, COUNT(*) as total')
            ->groupBy('expediteur_id')
            ->pluck('total', 'expediteur_id');

        return response()->json($compteurs);
    }
}
