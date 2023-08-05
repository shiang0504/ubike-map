export const getImageUrl=(file)=>{
  return new URL(`./assets/${file}`, import.meta.url).href
}