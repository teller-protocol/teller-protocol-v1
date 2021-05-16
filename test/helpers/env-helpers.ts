import { config } from 'dotenv'
config()

export const RUN_EXISTING: boolean = process.env.RUN_EXISTING ? true : false
