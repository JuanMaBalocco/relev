API PHP para relevamiento:

GET api.php?action=get&type=areas           // Devuelve áreas
GET api.php?action=get&type=edificios       // Devuelve edificios
GET api.php?action=get&type=relevamientos   // Devuelve relevamientos

POST api.php?action=add_area&nombre=...     // Agrega área
POST api.php?action=add_edificio&nombre=... // Agrega edificio
POST api.php?action=add_relevamiento&data=JSON // Agrega relevamiento

POST api.php?action=delete_area&nombre=...&clave=...         // Elimina área
POST api.php?action=delete_edificio&nombre=...&clave=...     // Elimina edificio
POST api.php?action=delete_relevamiento&idx=...&edificio=...&area=...&clave=... // Elimina relevamiento

La clave de admin está en config.json
