With this code:

```
const express = require('express');
const app = express();

app.post('/submit-form', (req, res) => {
    let body = '';

    // Collect the data chunks
    req.on('data', chunk => {
        body += chunk.toString();
    });

    // When all data is received
    req.on('end', () => {
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const parts = body.split(`--${boundary}`);

        // Extract form data
        const formData = {};
        parts.forEach(part => {
            if (part.includes('Content-Disposition')) {
                const nameMatch = part.match(/name="([^"]+)"/);
                const valueMatch = part.split('\r\n\r\n')[1];
                if (nameMatch && valueMatch) {
                    const name = nameMatch[1];
                    const value = valueMatch.trim();
                    formData[name] = value;
                }
            }
        });

        // Send the form data back as a JSON response
        res.json(formData);
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

I want to send a form data with `document: file, query: text`, how can I handle this, when I receive the request I want to write the uploaded document in a PDF and store using `fs` library, and I want to use the text from `query` field to be stored in a `const` for late usage.

---

## Responses:

- Using `multer`

```js
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

app.post('/upload-endpoint', upload.single('file'), (req, res) => {
	const query = req.body.query
	const filePath = req.file.path

	res.json({
		message: 'File and query received successfully!',
		data: {
			query: query,
			filePath: `/uploads/${req.file.filename}`,
		},
	})
})
```

If I use `multer`, how can I provide a way to notify the user about upload percentage? Like we had with SSE.

```js
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const app = express()

// Configure multer to store files in the 'uploads' directory
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadDir = path.join(__dirname, 'uploads')
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir)
		}
		cb(null, uploadDir)
	},
	filename: (req, file, cb) => {
		const generatedFileName = `user-file-${crypto.randomUUID()}${path.extname(
			file.originalname,
		)}`
		cb(null, generatedFileName)
	},
})

const upload = multer({ storage })

// Upload endpoint with progress updates using SSE
app.post('/upload-endpoint', (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')

	let totalBytes = parseInt(req.headers['content-length'], 10)
	let receivedBytes = 0

	req.on('data', (chunk) => {
		receivedBytes += chunk.length
		const percentComplete = ((receivedBytes / totalBytes) * 100).toFixed(2)
		res.write(`data: ${percentComplete}\n\n`) // Send progress update
	})

	req.on('end', () => {
		upload.single('file')(req, res, (err) => {
			if (err) {
				res.write(`data: {"error": "File upload failed"}\n\n`)
				return res.end()
			}

			const query = req.body.query
			const filePath = `/uploads/${req.file.filename}`

			// Send final response when upload is complete
			res.write(
				`data: {"message": "File and query received successfully!", "data": {"query": "${query}", "filePath": "${filePath}"}}\n\n`,
			)

			res.end()
		})
	})
})

app.listen(3000, () => {
	console.log('Server is running on port 3000')
})
```

```js
async searchInDocument(req, res) {
		res.setHeader('Content-Type', 'text/event-stream')
		res.setHeader('Cache-Control', 'no-cache')
		res.setHeader('Connection', 'keep-alive')

		let totalBytes = parseInt(req.headers['content-length'], 10)
		let receivedBytes = 0

		req.on('data', (chunk) => {
			receivedBytes += chunk.length
			const percentComplete = ((receivedBytes / totalBytes) * 100).toFixed(2)
			res.write(`data: ${percentComplete}\n\n`)
		})

		req.on('end', () => {
			upload.single('document')(req, res, (err) => {
				if (err) {
					res.write(`data: {"error": "File upload failed"}\n\n`)
					return res.end()
				}

				const query = req.body.query
				const filePath = `/uploads/${req.file.filename}`

				res.write(
					`data: {"message": "File and query received successfully!", "data": {"query": "${query}", "filePath": "${filePath}"}}\n\n`,
				)
				res.end()
			})
		})
	},
```