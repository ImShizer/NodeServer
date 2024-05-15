const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AdmZip = require('adm-zip');

const app = express();

app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

// Получение списка папок
app.get('/folders', (req, res) => {
    fs.readdir(__dirname + '/extracted', (err, files) => {
        if (err) {
            console.error('Ошибка при чтении файлов сервера:', err);
            return res.status(500).send('Ошибка сервера');
        }
        const folders = files.filter(file => fs.statSync(__dirname + '/extracted/' + file).isDirectory());
        res.json(folders.map(folder => ({ name: folder })));
    });
});

app.get('/download/:name', (req, res) => {
    const folderName = req.params.name;
    const folderPath = __dirname + '/extracted/' + folderName;
    const zipFilePath = __dirname + '/downloads/' + folderName + '.zip';

    const zip = new AdmZip();
    zip.addLocalFolder(folderPath);

    zip.writeZip(zipFilePath, err => {
        if (err) {
            console.error('Ошибка при создании zip-архива:', err);
            return res.status(500).send('Ошибка сервера');
        }
        res.download(zipFilePath, err => {
            if (err) {
                console.error('Ошибка при скачивании zip-архива:', err);
                return res.status(500).send('Ошибка сервера');
            }
            fs.unlink(zipFilePath, err => {
                if (err) {
                    console.error('Ошибка при удалении zip-архива:', err);
                }
            });
        });
    });
});

// Обработка загрузки файлов
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Нет загруженного файла.');
    }

    const zipPath = req.file.path;
    const zipName = req.file.originalname.split('.zip')[0];
    const extractDir = `${__dirname}/extracted/${zipName}`;

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    fs.unlink(zipPath, (err) => {
        if (err) {
            console.error('Ошибка при удалении zip-файла:', err);
        }
        console.log('Zip-файл успешно удалён.');
    });

    res.send(`Пак ${zipName} успешно загружен!`);
});

app.get('/folders', (req, res) => {
    fs.readdir(__dirname + '/extracted', (err, files) => {
        if (err) {
            console.error('Ошибка при чтении папок:', err);
            return res.status(500).send('Ошибка сервера');
        }
        const folders = files.filter(file => fs.statSync(__dirname + '/extracted/' + file).isDirectory());
        res.json(folders.map(folder => ({ name: folder })));
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}.`);
});
