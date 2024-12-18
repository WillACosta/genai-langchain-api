export type UserParams = {
	id: string
	email: string
	password: string
	name?: string
	role?: 'user' | 'admin'
}
