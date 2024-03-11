window.addEventListener("load", async function(e) {
   
    fetch('https://raw.githubusercontent.com/gianmarco21sz/gm_extension/main/extension.min.js')
    .then( res => res.text() )
    .then( async data => eval(data));
    
})
