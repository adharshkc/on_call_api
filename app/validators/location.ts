import vine from '@vinejs/vine'

export const dummyLocationValidator = vine.compile(
	vine.object({
		name: vine.string().optional(),
	})
)