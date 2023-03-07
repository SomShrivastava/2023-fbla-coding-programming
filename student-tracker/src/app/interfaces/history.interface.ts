export interface History {
    date: string,
    topWinner: {
        id: string,
        prize: string
    }, 
    randomWinner: {
        id: string,
        prize: string
    }
};