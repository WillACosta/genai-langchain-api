import { Request, Response } from 'express'

import { searchInDocumentUseCase, translateUseCase } from '@/di'
import { upload } from '../../core'

export class GenAIController {
	async translateText(
		req: Request<any, any, { text: string; language: string }>,
		res: Response,
	) {
		const { text, language } = req.body

		if (language === undefined || text === undefined) {
			return res.status(400).send({
				message: 'Invalid request, set language and text in the request body!',
			})
		}

		const result = await translateUseCase.invoke({ text, language })
		return res.send(result)
	}

	async searchInDocument(
		req: Request<any, any, { query: string }>,
		res: Response,
	) {
		upload(req, res, async (err) => {
			if (err) {
				return res
					.status(500)
					.json({ message: 'File upload failed!', error: err })
			}

			if (!req.file) {
				return res.status(400).json({ message: 'Please provide a valid file!' })
			}

			const query = req.body.query
			const filePath = `/uploads/${req.file.filename}`

			const { result } = await searchInDocumentUseCase.invoke({
				query,
				filePath,
			})

			return res.json({
				message: 'File and query received successfully!',
				data: { query, filePath },
				result,
			})
		})
	}
}
