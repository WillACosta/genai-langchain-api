import { UseCase } from '@/common/types'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

type Params = {
	text: string
	language: string
}

export class TranslateTextUseCase implements UseCase<string, Params> {
	async invoke(params: { text: string; language: string }): Promise<string> {
		const { text, language } = params

		/// TODO: create a service to implement common LLM components
		const API_KEY = process.env['GOOGLE_GENAI_API_KEY']
		const aiModel = new ChatGoogleGenerativeAI({
			model: 'gemini-1.5-flash',
			temperature: 0,
			apiKey: API_KEY,
		})

		const systemTemplate = 'Translate the following text into {language}:'
		const promptTemplate = ChatPromptTemplate.fromMessages([
			['system', systemTemplate],
			['user', '{text}'],
		])

		const chain = promptTemplate.pipe(aiModel).pipe(new StringOutputParser())
		return await chain.invoke({
			language: language,
			text: text,
		})
	}
}
