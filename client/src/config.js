const ENV = process.env.env
let apiURL = ''
if(ENV === 'Prod'){
    apiURL='http://18.191.91.187:5000'
}else{
    apiURL = 'http://localhost:5000'
}


export default apiURL