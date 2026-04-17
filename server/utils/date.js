export const currentDate = () => {
    const day = new Date().getDate()
    const month = (new Date().getMonth() + 1) < 10 ? `0${new Date().getMonth() + 1}` : new Date().getMonth() + 1
    const year = new Date().getFullYear()

    return `${day}-${month}-${year}`
}