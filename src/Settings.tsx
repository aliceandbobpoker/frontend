export type Settings = {
    centered: boolean;
    darkMode: boolean;
    useClassic: boolean;
    muteSound: boolean;
}

export const getDefaultSettings = (): Settings => {
    return {
        centered: false,
        darkMode: false,
        useClassic: false,
        muteSound: false
    }
}