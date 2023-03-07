import { Event } from "./event.interface";

export interface User {
    id: string,
    name: string,
    email: string,
    pfp: string,
    quarter?: string,
    grade?: number,
    schoolId?: string,
    points?: number,
    events?: Event[]
}