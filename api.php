<?php
header('Content-Type: application/json');

function getJson($file) {
    if (!file_exists($file)) return [];
    $data = file_get_contents($file);
    return json_decode($data, true) ?: [];
}

function saveJson($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get':
        $type = $_GET['type'] ?? '';
        if ($type === 'areas') {
            echo json_encode(getJson('areas.json'));
        } elseif ($type === 'edificios') {
            echo json_encode(getJson('edificios.json'));
        } elseif ($type === 'relevamientos') {
            echo json_encode(getJson('relevamientos.json'));
        } else {
            echo json_encode([]);
        }
        break;
    case 'add_area':
        $nombre = trim($_POST['nombre'] ?? '');
        if ($nombre) {
            $areas = getJson('areas.json');
            if (!in_array($nombre, $areas)) $areas[] = $nombre;
            saveJson('areas.json', $areas);
            echo json_encode(['ok' => true, 'areas' => $areas]);
        } else {
            echo json_encode(['ok' => false]);
        }
        break;
    case 'add_edificio':
        $nombre = trim($_POST['nombre'] ?? '');
        if ($nombre) {
            $edificios = getJson('edificios.json');
            if (!in_array($nombre, $edificios)) $edificios[] = $nombre;
            saveJson('edificios.json', $edificios);
            echo json_encode(['ok' => true, 'edificios' => $edificios]);
        } else {
            echo json_encode(['ok' => false]);
        }
        break;
    case 'add_relevamiento':
        $data = json_decode($_POST['data'] ?? '', true);
        if ($data) {
            $relevamientos = getJson('relevamientos.json');
            $relevamientos[] = $data;
            saveJson('relevamientos.json', $relevamientos);
            echo json_encode(['ok' => true, 'relevamientos' => $relevamientos]);
        } else {
            echo json_encode(['ok' => false]);
        }
        break;
    case 'delete_area':
        $nombre = trim($_POST['nombre'] ?? '');
        $clave = $_POST['clave'] ?? '';
        $config = getJson('config.json');
        if ($nombre && $clave && $clave === ($config['claveAdmin'] ?? '')) {
            $areas = getJson('areas.json');
            $areas = array_values(array_filter($areas, fn($a) => $a !== $nombre));
            saveJson('areas.json', $areas);
            echo json_encode(['ok' => true, 'areas' => $areas]);
        } else {
            echo json_encode(['ok' => false]);
        }
        break;
    case 'delete_edificio':
        $nombre = trim($_POST['nombre'] ?? '');
        $clave = $_POST['clave'] ?? '';
        $config = getJson('config.json');
        if ($nombre && $clave && $clave === ($config['claveAdmin'] ?? '')) {
            $edificios = getJson('edificios.json');
            $edificios = array_values(array_filter($edificios, fn($e) => $e !== $nombre));
            saveJson('edificios.json', $edificios);
            echo json_encode(['ok' => true, 'edificios' => $edificios]);
        } else {
            echo json_encode(['ok' => false]);
        }
        break;
    case 'delete_relevamiento':
        $idx = intval($_POST['idx'] ?? -1);
        $edificio = $_POST['edificio'] ?? '';
        $area = $_POST['area'] ?? '';
        $clave = $_POST['clave'] ?? '';
        $config = getJson('config.json');
        if ($idx >= 0 && $edificio && $area && $clave && $clave === ($config['claveAdmin'] ?? '')) {
            $relevamientos = getJson('relevamientos.json');
            $i = 0;
            foreach ($relevamientos as $j => $r) {
                if ($r['edificio'] === $edificio && $r['area'] === $area) {
                    if ($i === $idx) {
                        array_splice($relevamientos, $j, 1);
                        break;
                    }
                    $i++;
                }
            }
            saveJson('relevamientos.json', $relevamientos);
            echo json_encode(['ok' => true, 'relevamientos' => $relevamientos]);
        } else {
            echo json_encode(['ok' => false]);
        }
        break;
    default:
        echo json_encode(['ok' => false, 'msg' => 'Acción no válida']);
}
