export interface Event {
    name: string,
    description: string
    date: string,
    timeLength: number,
    attended: boolean,
    type: string,
    types: {name: string}[]
}