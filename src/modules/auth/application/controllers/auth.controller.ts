import crypto from 'crypto'
import jwt from 'jsonwebtoken'

import { Request, Response } from 'express'

import { UserDataProvider } from '@/modules/users/adapters/dataproviders/user.dataprovider'
import { UserParams } from '@/modules/users/core'

export class AuthController {
	constructor(private _userDataProvider: UserDataProvider) {}

	register = async (req: Request<UserParams>, res: Response) => {
		const { password, role, ...rest } = req.body
		const encryptedPassword = this._encryptPassword(password)
		const currentRole = role ?? 'user'

		const userFound = await this._userDataProvider.findUserByEmail(rest.email)

		if (userFound) {
			return res.status(400).json({
				success: false,
				error: { message: 'This email is already in use!' },
			})
		}

		return this._userDataProvider
			.insert({
				...rest,
				password: encryptedPassword,
				role: currentRole,
			})
			.then((user) => {
				return res.status(201).json({
					success: true,
					data: {
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
							createdAt: user.createdAt,
							role: user.role,
						},
						token: this._generateAccessToken(user),
					},
				})
			})
			.catch((err) => {
				return res.status(500).json({
					success: false,
					error: err,
				})
			})
	}

	sign = async (req: Request<UserParams>, res: Response) => {
		const { password, email } = req.body
		const encryptedPassword = this._encryptPassword(password)
		const defaultErrorMessage = 'Provided email or password might be incorrect.'

		this._userDataProvider.findUserByEmail(email).then((user) => {
			if (!user) {
				return res.status(401).json({
					status: false,
					error: {
						message: defaultErrorMessage,
					},
				})
			}

			if (user.password !== encryptedPassword) {
				return res.status(401).json({
					status: false,
					error: {
						message: defaultErrorMessage,
					},
				})
			}

			return res.status(200).json({
				status: true,
				data: {
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						createdAt: user.createdAt,
						role: user.role,
					},
					token: this._generateAccessToken(user),
				},
			})
		})
	}

	private _encryptPassword(password: string) {
		const hash = crypto.createHash('sha256')
		hash.update(password)
		return hash.digest('hex')
	}

	private _generateAccessToken({ id, name }: any) {
		return jwt.sign({ id, name }, process.env['JWT_SECRET']!, {
			expiresIn: process.env['JWT_EXPIRATION'],
		})
	}
}
