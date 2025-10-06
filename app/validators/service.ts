import vine from '@vinejs/vine'

export const createServiceValidator = vine.compile(
	vine.object({
		name: vine.string(),
		slug: vine.string().optional(),
		description: vine.string().optional(),
		fullDescription: vine.string().optional(),
		detailedDescription: vine.string().optional(),
		whatIs: vine.string().optional(),
		typicalVisit: vine.string().optional(),
		category: vine.string(),
		price: vine.number().optional(),
		duration: vine.number().optional(),
		services: vine.array(vine.string()).optional(),
		benefits: vine.string().optional(),
		benefitsExtended: vine.string().optional(),
		gettingStarted: vine.string().optional(),
		gettingStartedPoints: vine.array(vine.string()).optional(),
		image: vine.string().optional(),
		icon: vine.string().optional(),
		stats: vine.array(
			vine.object({
				number: vine.string(),
				suffix: vine.string().optional(),
				label: vine.string(),
				icon: vine.string().optional(),
			})
		).optional(),
		isActive: vine.boolean().optional(),
	})
)

export const updateServiceValidator = vine.compile(
	vine.object({
		name: vine.string().optional(),
		slug: vine.string().optional(),
		description: vine.string().optional(),
		fullDescription: vine.string().optional(),
		detailedDescription: vine.string().optional(),
		whatIs: vine.string().optional(),
		typicalVisit: vine.string().optional(),
		category: vine.string().optional(),
		price: vine.number().optional(),
		duration: vine.number().optional(),
		services: vine.array(vine.string()).optional(),
		benefits: vine.string().optional(),
		benefitsExtended: vine.string().optional(),
		gettingStarted: vine.string().optional(),
		gettingStartedPoints: vine.array(vine.string()).optional(),
		image: vine.string().optional(),
		icon: vine.string().optional(),
		stats: vine.array(
			vine.object({
				number: vine.string(),
				suffix: vine.string().optional(),
				label: vine.string(),
				icon: vine.string().optional(),
			})
		).optional(),
		isActive: vine.boolean().optional(),
	})
)