let IS_PROD = true

const server=IS_PROD ? 
"https://videocallbackend-4lwk.onrender.com":
"http://localhost:8000"

export default server