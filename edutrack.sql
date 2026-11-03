-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 29 avr. 2026 à 14:02
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `edutrack`
--

-- --------------------------------------------------------

--
-- Structure de la table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `annee_academique` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `classes`
--

INSERT INTO `classes` (`id`, `nom`, `annee_academique`, `created_at`, `updated_at`) VALUES
(1, 'SIL3', '2025-2026', '2026-04-25 22:15:12', '2026-04-25 22:15:12');

-- --------------------------------------------------------

--
-- Structure de la table `cours`
--

CREATE TABLE `cours` (
  `id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `titre_chapitre` varchar(255) DEFAULT NULL,
  `numero_chapitre` int(11) DEFAULT NULL,
  `resume` text DEFAULT NULL,
  `statut` enum('brouillon','soumis','corrige','valide') DEFAULT 'brouillon',
  `cree_par` int(11) NOT NULL,
  `valide_par` int(11) DEFAULT NULL,
  `signature_prof` text DEFAULT NULL,
  `date_validation` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `cours`
--

INSERT INTO `cours` (`id`, `matiere_id`, `classe_id`, `date`, `heure_debut`, `heure_fin`, `titre_chapitre`, `numero_chapitre`, `resume`, `statut`, `cree_par`, `valide_par`, `signature_prof`, `date_validation`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2026-04-26', NULL, NULL, 'SDFGYHU', 2, 'QSDFGHIKOLMLKJHGFDSERTYHJK', 'valide', 4, 3, NULL, '2026-04-26 01:51:12', '2026-04-26 01:49:52', '2026-04-26 01:51:12'),
(2, 1, 1, '2026-04-26', '08:00:00', '12:15:00', '%MLKJHGFD', 5, 'GUFUIJGVHBN?.%MLKJHGFPOIUYTSDFGIUYTR', 'valide', 7, 8, NULL, '2026-04-26 10:45:37', '2026-04-26 10:43:39', '2026-04-26 10:45:37');

-- --------------------------------------------------------

--
-- Structure de la table `enseignant_matiere_classe`
--

CREATE TABLE `enseignant_matiere_classe` (
  `id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `enseignant_matiere_classe`
--

INSERT INTO `enseignant_matiere_classe` (`id`, `enseignant_id`, `matiere_id`, `classe_id`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 1, '2026-04-25 22:33:27', '2026-04-25 22:33:27'),
(2, 8, 1, 1, '2026-04-26 10:38:16', '2026-04-26 10:38:16');

-- --------------------------------------------------------

--
-- Structure de la table `etudiant_classe`
--

CREATE TABLE `etudiant_classe` (
  `id` int(11) NOT NULL,
  `etudiant_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `est_delegue` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `etudiant_classe`
--

INSERT INTO `etudiant_classe` (`id`, `etudiant_id`, `classe_id`, `est_delegue`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 0, '2026-04-25 23:08:23', '2026-04-26 11:35:21'),
(2, 5, 1, 0, '2026-04-26 01:56:51', '2026-04-26 01:56:51'),
(3, 7, 1, 0, '2026-04-26 10:35:02', '2026-04-29 00:30:42'),
(4, 9, 1, 1, '2026-04-28 23:30:38', '2026-04-29 00:30:42');

-- --------------------------------------------------------

--
-- Structure de la table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `cours_id` int(11) NOT NULL,
  `etudiant_id` int(11) NOT NULL,
  `note_clarte` int(11) DEFAULT NULL CHECK (`note_clarte` between 1 and 5),
  `note_contenu` int(11) DEFAULT NULL CHECK (`note_contenu` between 1 and 5),
  `note_supports` int(11) DEFAULT NULL CHECK (`note_supports` between 1 and 5),
  `commentaire` text DEFAULT NULL,
  `est_anonyme` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `evaluations`
--

INSERT INTO `evaluations` (`id`, `cours_id`, `etudiant_id`, `note_clarte`, `note_contenu`, `note_supports`, `commentaire`, `est_anonyme`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 3, 4, 4, 'cest bien', 1, '2026-04-26 01:57:30', '2026-04-26 01:57:30'),
(2, 2, 7, 4, 4, 4, 'C\'est bien', 1, '2026-04-26 10:46:43', '2026-04-26 10:46:43'),
(3, 2, 9, 2, 2, 2, NULL, 1, '2026-04-29 06:30:42', '2026-04-29 06:30:42');

-- --------------------------------------------------------

--
-- Structure de la table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

CREATE TABLE `matieres` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `total_chapitres` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `matieres`
--

INSERT INTO `matieres` (`id`, `nom`, `code`, `description`, `total_chapitres`, `created_at`, `updated_at`) VALUES
(1, 'MVC', '234', 'Lravel', 5, '2026-04-25 22:24:16', '2026-04-25 22:24:16');

-- --------------------------------------------------------

--
-- Structure de la table `mes_cours_personnels`
--

CREATE TABLE `mes_cours_personnels` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `etudiant_id` bigint(20) UNSIGNED NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `contenu` longtext DEFAULT NULL,
  `statut` enum('a_venir','en_cours','termine') NOT NULL DEFAULT 'a_venir',
  `couleur` varchar(20) NOT NULL DEFAULT '#ffffff',
  `icone` varchar(50) NOT NULL DEFAULT 'book-open',
  `ordre` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `mes_cours_personnels`
--

INSERT INTO `mes_cours_personnels` (`id`, `etudiant_id`, `titre`, `description`, `contenu`, `statut`, `couleur`, `icone`, `ordre`, `created_at`, `updated_at`) VALUES
(1, 9, 'Maths', 'Chiffres', 'Chapitre1:', 'en_cours', '#fef3c7', 'book-open', 0, '2026-04-29 02:34:21', '2026-04-29 02:35:11'),
(2, 9, 'PCT', 'PHYSIQUE', '', 'a_venir', '#ffffff', 'book-open', 1, '2026-04-29 06:26:08', '2026-04-29 06:26:08');

-- --------------------------------------------------------

--
-- Structure de la table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(5, '2026_04_25_220106_create_personal_access_tokens_table', 2),
(6, '2026_04_29_000000_create_mes_cours_personnels_table', 3);

-- --------------------------------------------------------

--
-- Structure de la table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\Utilisateur', 9, 'etudiant-token', 'cda3581dfacc30fc92889c68e960c2a4a6d61ab81876d1bffa2d7dd4bc56b5c2', '[\"*\"]', '2026-04-29 06:23:37', NULL, '2026-04-29 02:26:59', '2026-04-29 06:23:37'),
(2, 'App\\Models\\Utilisateur', 9, 'etudiant-token', '58495ebf7709fc18d8612ecb6af7f1d23fc6e68bdd60fd458d10e3dbc00f2327', '[\"*\"]', '2026-04-29 06:32:54', NULL, '2026-04-29 06:25:02', '2026-04-29 06:32:54'),
(3, 'App\\Models\\Utilisateur', 9, 'etudiant-token', '10a6dd6677fc441d12d323c7ba8cb9e7bb3a730f2b61c9b60cb89e95af313b59', '[\"*\"]', '2026-04-29 06:33:42', NULL, '2026-04-29 06:33:40', '2026-04-29 06:33:42'),
(4, 'App\\Models\\Utilisateur', 2, 'admin-token', '41763eb3b1aeeb2e0538aeb27b6779c4e812be0998e85492d174a0bcf9ae7ccf', '[\"*\"]', '2026-04-29 07:46:50', NULL, '2026-04-29 07:41:36', '2026-04-29 07:46:50'),
(5, 'App\\Models\\Utilisateur', 9, 'etudiant-token', '6171f6624a9fdeba5f0f1c7762604516487f42894fb7ba18a00d3a212163c0a1', '[\"*\"]', '2026-04-29 08:34:13', NULL, '2026-04-29 08:15:31', '2026-04-29 08:34:13'),
(6, 'App\\Models\\Utilisateur', 2, 'admin-token', 'b647ba9c7d7f961060b6e8d57508b6b033a30617e72e8d4decfe06b2226fa12f', '[\"*\"]', '2026-04-29 08:37:58', NULL, '2026-04-29 08:36:09', '2026-04-29 08:37:58'),
(7, 'App\\Models\\Utilisateur', 9, 'etudiant-token', '746c83e434faa9a1ebe801d775038c4d414bed5b61618eb5344baec91e2b163b', '[\"*\"]', '2026-04-29 09:20:32', NULL, '2026-04-29 08:48:26', '2026-04-29 09:20:32'),
(8, 'App\\Models\\Utilisateur', 9, 'etudiant-token', '82fb1326e0b84040d47fdcb5c34ea0dd2666087b0e796f0cf0fb7f1bfa4b163e', '[\"*\"]', '2026-04-29 08:55:11', NULL, '2026-04-29 08:50:53', '2026-04-29 08:55:11'),
(9, 'App\\Models\\Utilisateur', 9, 'etudiant-token', 'b60a059ffeb69b0910c84af4f5007c7a09d8189a5228039a7836f5ce3fea7ca7', '[\"*\"]', '2026-04-29 09:07:54', NULL, '2026-04-29 09:07:51', '2026-04-29 09:07:54'),
(10, 'App\\Models\\Utilisateur', 2, 'admin-token', '1bdc2f3ed4dd98bbe612f2c401475998545b709d19239c7214326f13d0f08c6b', '[\"*\"]', '2026-04-29 09:20:58', NULL, '2026-04-29 09:20:56', '2026-04-29 09:20:58');

-- --------------------------------------------------------

--
-- Structure de la table `presences`
--

CREATE TABLE `presences` (
  `id` int(11) NOT NULL,
  `cours_id` int(11) NOT NULL,
  `etudiant_id` int(11) NOT NULL,
  `statut` enum('present','absent','retard') NOT NULL,
  `heure_scan` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `scanne_par` int(11) DEFAULT NULL,
  `est_valide` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `presences`
--

INSERT INTO `presences` (`id`, `cours_id`, `etudiant_id`, `statut`, `heure_scan`, `scanne_par`, `est_valide`, `created_at`, `updated_at`) VALUES
(1, 1, 9, 'present', '2026-04-28 23:34:25', 9, 1, '2026-04-28 23:34:25', '2026-04-28 23:34:25'),
(2, 2, 9, 'present', '2026-04-29 06:29:27', 9, 1, '2026-04-29 06:29:27', '2026-04-29 06:29:27');

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('HxksYgCtKiJZBbi4ykuHx3GeRTw3oeSjPe6a1cGO', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiTXBGUlhicjNCOHhFOFRRTkhPRXNoUmJZZWJVRjJDRjg0dmZtMGNNcSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1777422362);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` int(11) NOT NULL,
  `nom_complet` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role` enum('admin','enseignant','etudiant','delegue') NOT NULL,
  `matricule` varchar(20) DEFAULT NULL,
  `code_qr` text DEFAULT NULL,
  `est_valide` tinyint(1) DEFAULT 0,
  `telephone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom_complet`, `email`, `mot_de_passe`, `role`, `matricule`, `code_qr`, `est_valide`, `telephone`, `created_at`, `updated_at`) VALUES
(2, 'Admin Principal', 'admin@edutrack.com', '$2y$12$rqkKu92O/IiXzW8yXU0BhOWpycA5CqG.Wu2tllii1xdbnbMImJGCu', 'admin', NULL, NULL, 1, NULL, '2026-04-25 21:30:06', '2026-04-25 21:30:06'),
(3, 'DOSSOU-HO Mathieu', 'dossouhomathieu@gmail.com', '$2y$12$Qdn9K3GiCm7hzuZThpSO8OZmrjeUbMZzHftuHLvjiWRxdhFrSWVaq', 'enseignant', NULL, NULL, 1, '22962532655', '2026-04-25 22:01:30', '2026-04-25 22:01:30'),
(4, 'DOSSOU-HO Frumence', 'dossouhofrumence@gmail.com', '$2y$12$NSZUEs2dzVEXUfr8DckYP.6uSxZZasADf2yAC7Ld5SEY3v.z.RpL6', 'delegue', '123456789', '{\"id\":4,\"matricule\":\"123456789\",\"nom\":\"DOSSOU-HO Frumence\"}', 1, NULL, '2026-04-25 22:59:16', '2026-04-26 02:14:38'),
(5, 'DJOUBEROU Taorid', 'taorid@gmail.com', '$2y$12$ZYY/KZ1raDi8TcwZgDabbO8agwYY46KhHr2vWBGHyVh0Bb4DMtWSq', 'etudiant', '456789', '{\"id\":5,\"matricule\":\"456789\",\"nom\":\"DJOUBEROU Taorid\"}', 1, NULL, '2026-04-25 23:30:51', '2026-04-26 03:21:41'),
(6, 'SOWANOU', 'lea2000@gmail.com', '$2y$12$J5BrVWgRT4UFhtmaz46qduMkuUrDYZPTPk.5e.AJFoc0EM6e6AdAq', 'etudiant', '9864547859', NULL, 1, NULL, '2026-04-26 10:31:27', '2026-04-26 10:31:44'),
(7, 'ANIAMBOSSOU', 'maryline@gmail.com', '$2y$12$pVTEfnXqmhjvRbvPPquSk.0ckKuYurhzXY9kiP5wGANgARimcZJ5e', 'delegue', '67890987', '{\"id\":7,\"matricule\":\"67890987\",\"nom\":\"ANIAMBOSSOU\"}', 1, NULL, '2026-04-26 10:33:41', '2026-04-26 10:47:13'),
(8, 'SOWANOU', 'lea@2000gmail.com', '$2y$12$KEhTLckWhOECDju9xUBMs.9m1rf9Z1FziINRUse3IQ8pGbNyVzJBe', 'enseignant', NULL, NULL, 1, '23456789987', '2026-04-26 10:36:16', '2026-04-26 10:36:16'),
(9, 'Shallum Arel', 'shallare19@gmail.com', '$2y$12$WuxLSgopbqz5P.6xg.kflOIwbIRawgiKzBd1eCL/4DKwseNlAwlfm', 'delegue', '1234567', '{\"id\":9,\"matricule\":\"1234567\",\"nom\":\"Shallum Arel\"}', 1, NULL, '2026-04-28 23:28:26', '2026-04-28 23:31:26');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Index pour la table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Index pour la table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `cours`
--
ALTER TABLE `cours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `matiere_id` (`matiere_id`),
  ADD KEY `classe_id` (`classe_id`),
  ADD KEY `cree_par` (`cree_par`),
  ADD KEY `valide_par` (`valide_par`);

--
-- Index pour la table `enseignant_matiere_classe`
--
ALTER TABLE `enseignant_matiere_classe`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `enseignant_id` (`enseignant_id`,`matiere_id`,`classe_id`),
  ADD KEY `matiere_id` (`matiere_id`),
  ADD KEY `classe_id` (`classe_id`);

--
-- Index pour la table `etudiant_classe`
--
ALTER TABLE `etudiant_classe`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `etudiant_id` (`etudiant_id`,`classe_id`),
  ADD KEY `classe_id` (`classe_id`);

--
-- Index pour la table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cours_id` (`cours_id`,`etudiant_id`),
  ADD KEY `etudiant_id` (`etudiant_id`);

--
-- Index pour la table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Index pour la table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Index pour la table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `matieres`
--
ALTER TABLE `matieres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Index pour la table `mes_cours_personnels`
--
ALTER TABLE `mes_cours_personnels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mes_cours_personnels_etudiant_id_index` (`etudiant_id`);

--
-- Index pour la table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Index pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Index pour la table `presences`
--
ALTER TABLE `presences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cours_id` (`cours_id`,`etudiant_id`),
  ADD KEY `etudiant_id` (`etudiant_id`),
  ADD KEY `scanne_par` (`scanne_par`);

--
-- Index pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `matricule` (`matricule`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `cours`
--
ALTER TABLE `cours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `enseignant_matiere_classe`
--
ALTER TABLE `enseignant_matiere_classe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `etudiant_classe`
--
ALTER TABLE `etudiant_classe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `matieres`
--
ALTER TABLE `matieres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `mes_cours_personnels`
--
ALTER TABLE `mes_cours_personnels`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `presences`
--
ALTER TABLE `presences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `cours`
--
ALTER TABLE `cours`
  ADD CONSTRAINT `cours_ibfk_1` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`),
  ADD CONSTRAINT `cours_ibfk_2` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `cours_ibfk_3` FOREIGN KEY (`cree_par`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `cours_ibfk_4` FOREIGN KEY (`valide_par`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `enseignant_matiere_classe`
--
ALTER TABLE `enseignant_matiere_classe`
  ADD CONSTRAINT `enseignant_matiere_classe_ibfk_1` FOREIGN KEY (`enseignant_id`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `enseignant_matiere_classe_ibfk_2` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`),
  ADD CONSTRAINT `enseignant_matiere_classe_ibfk_3` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`);

--
-- Contraintes pour la table `etudiant_classe`
--
ALTER TABLE `etudiant_classe`
  ADD CONSTRAINT `etudiant_classe_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `etudiant_classe_ibfk_2` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`);

--
-- Contraintes pour la table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`cours_id`) REFERENCES `cours` (`id`),
  ADD CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`etudiant_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `presences`
--
ALTER TABLE `presences`
  ADD CONSTRAINT `presences_ibfk_1` FOREIGN KEY (`cours_id`) REFERENCES `cours` (`id`),
  ADD CONSTRAINT `presences_ibfk_2` FOREIGN KEY (`etudiant_id`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `presences_ibfk_3` FOREIGN KEY (`scanne_par`) REFERENCES `utilisateurs` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
