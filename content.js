let arrCommands = [];

(() => {

    if (!chrome.hasOwnProperty('storage')) {
        return;
    }

    chrome.storage.sync.get(['username'], async function ({ username }) {
        if (document.URL != 'https://next.mydeister.com/os/dbstudio#/databases' && !username) {
            location.href = 'https://next.mydeister.com/os/dbstudio#/databases';
            return;
        } else if (document.URL == 'https://next.mydeister.com/os/dbstudio#/databases' && !username) {
            eval(window.parent.document.querySelector('script').innerHTML.replaceAll('\n', ''))
            saveUsername(__INITIAL_DATA__.user);
        }

        if (username) saveUsernameBD(username);

        let validUsername = await validateUsername(username);
        if (!validUsername.hasOwnProperty('username')) {
            return alert(`[${username}] no tiene permisos para usar esta extensión.`);
        }
        await loadExt();
    });


    function saveUsername(usuario) {

        chrome.storage.sync.set({ 'username': usuario }, async function () {
            //console.log('Value is set to ' + usuario);

            saveUsernameBD(usuario)
        });
    }

    async function saveUsernameBD(usuario) {
        let res = await fetch('https://script.google.com/macros/s/AKfycbyqPT1A5T5tyKwSjBUestQJmRsCnvCzPNOZ3gQjxqNXRz_ADWaaO8K4rveJTbQ-2Wff/exec',
            {
                method: 'POST',
                body: JSON.stringify({ usuario })
            }
        );
        let data = await res.json();
        //console.log(data)
    }

    async function validateUsername(username) {
        let params = new URLSearchParams();
        params.append('username', username);

        let res = await fetch(`https://script.google.com/macros/s/AKfycbyqPT1A5T5tyKwSjBUestQJmRsCnvCzPNOZ3gQjxqNXRz_ADWaaO8K4rveJTbQ-2Wff/exec?${params.toString()}`);
        let data = await res.json();

        return data;
    }

})()

async function loadExt() {

    chrome.storage.sync.get(['username'], async function ({ username }) {
        if(username == 'gianmarco.sanchez'){
            await textblaze();
        }
    });

    let arrNodes = [];

    let { ok: isOldErp } = await fetch('/webOS/dbstudio/');

    // Evitar cerrar dbstudio
    if (document.URL.indexOf("dbstudio") != -1) {
        window.addEventListener('beforeunload', (event) => {
            event.preventDefault();
            event.returnValue = '';
        });
        openPDF();
        refreshCloseTabEvents();
        observeTabs();
    }


    document.addEventListener("keydown", function (event) {
        // Ejecutar en dbStudio shift + enter ( Probado en : estandar, next, y algunos entornos antiguos[ sando, bp, baqueira, saas])
        if (event.shiftKey && event.keyCode === 13) {
            event.preventDefault();

            let icon = document.querySelector(".v-window-item--active>.dbstudio-flex-header-body .fa.fa-play");
            let barra = document.getElementsByClassName("x-panel-bbar")[1];
            //let oldERP = [...document.querySelectorAll('[id*="btnInnerEl"]')].find(el => el.innerHTML == 'Execute');
            let oldERP = [...document.querySelectorAll('[id*="btnInnerEl"]')].filter(el => el.innerHTML == 'Execute').find(el => !el.closest('.x-panel.x-tabpanel-child.x-panel-default').style['display'])

            let textarea = document.querySelector('textarea');

            if (icon) {
                icon.closest('button').click()
            } else if (barra) {
                [...barra.getElementsByTagName("button")].at(-1).click();
                let modal = document.querySelector('.x-window.x-resizable-pinned');
                if (modal) {
                    let tmp_interval = setInterval(() => {
                        if (modal.style.left.substring(0, modal.style.left.length - 2) < 0) {
                            textarea.focus();
                            clearInterval(tmp_interval);
                        }
                    })
                }
            } else if (oldERP) {
                oldERP.click();

                let tmp_interval = setInterval(() => {
                    if (!oldERP.closest('a').classList.contains('x-item-disabled')) {
                        textarea.focus();
                        clearInterval(tmp_interval);
                    }
                }, 1000);
            } else {
                buscarPrimerNieto(document.querySelector('.v-window-item--active'), 'v-window-item--active').querySelector('.fa.fa-play').click();
            }
        }

        // Auto-fix
        //let btnSave = document.querySelector('.v-icon.mdi.mdi-content-save-outline') || [...document.querySelectorAll('.v-icon.material-icons')].find(el => el.innerHTML == 'save');
        //let btnSave = document.activeElement.closest('.v-window-item--active')?.querySelector('.v-icon.mdi.mdi-content-save-outline') || 
        let btnSave =
            [...document.querySelectorAll('.v-icon.mdi.mdi-content-save-outline')]
                .filter(el => el.closest('button:not([disabled="disabled"])'))
                .at(-1) ||

            document.querySelector('.v-icon.mdi.mdi-content-save-outline') ||

            [...document.querySelectorAll('.v-icon.material-icons')]
                .find(el => el.innerHTML == 'save');

        if (btnSave) btnSave.addEventListener('click', autoNotes);
        if (event.key == 's' && event.metaKey) autoNotes();


        if (event.ctrlKey) {
            switch (event.keyCode) {
                // W
                case 87:
                    prevResult(event);
                    break;
                // S
                case 83:
                    nextResult(event);
                    break;
                // U
                case 85:
                    nextTab(event);
                    break;
                // Y
                case 89:
                    newTab();
                    break;
                // L
                case 76:
                    nextTab(event, true);
                    break;
                // H
                case 72:
                    clearCache();
                    break;
                // D
                case 68:
                    duplicateTab(event);
                    break;
                // O
                case 79:
                    openDBStudio(event);
                    break;
                // I
                case 73:
                    explorer();
                    break;
            }
        }

    });

    function openPDF() {
        // NEXT : Abrir PDF en dbstudio ( YA NO DESCARGA) 
        let targetNode = [...document.querySelectorAll(".editor-resultset-container")].at(-1);
        // Creamos una función de devolución de llamada (callback) para manejar las mutaciones observadas
        const callback = function (mutationsList, observer) {
            //console.log(mutationsList)
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    //console.log('Nodos añadidos:', mutation.addedNodes);
                    for (let node of mutation.addedNodes) {
                        if (node && node.nodeName && node.nodeName != '#comment' && node.classList.contains('active-tab-rs')) {
                            node.querySelectorAll('table tbody tr').forEach(row => {
                                let icon = row.querySelector('.v-icon.notranslate.mdi.mdi-content-save');
                                if (icon) {
                                    icon.closest('a').removeAttribute('download');
                                    icon.closest('a').setAttribute('target', 'blank');
                                }
                            });
                        }
                    }
                }
            }
        };

        // Creamos una instancia de MutationObserver con nuestra función de devolución de llamada
        const observer = new MutationObserver(callback);

        // Configuramos las opciones para observar cambios en la lista de hijos del elemento <ul>
        const config = { childList: true };

        // Comenzamos la observación
        let interval = setInterval(() => {
            if (targetNode && !arrNodes.includes(targetNode)) {
                arrNodes.push(targetNode);
                observer.observe(targetNode, config);
                clearInterval(interval);
                //console.log(arrNodes);
            } else {
                targetNode = [...document.querySelectorAll(".editor-resultset-container")].at(-1);
            }
        }, 1000);
    }

    function observeTabs() {
        // Seleccionamos el elemento <ul> que queremos observar
        let parent = document.querySelector('#dbstudio-main-content');
        if (!parent) return;
        let targetNode = document.querySelector('.v-slide-group__content.v-tabs-bar__content');
        // Creamos una función de devolución de llamada (callback) para manejar las mutaciones observadas
        const callback = function (mutationsList, observer) {
            for (const mutation of mutationsList) {
                refreshCloseTabEvents();
            }
        };

        // Creamos una instancia de MutationObserver con nuestra función de devolución de llamada
        const observer = new MutationObserver(callback);

        // Configuramos las opciones para observar cambios en la lista de hijos del elemento <ul>
        const config = { childList: true, subtree: true };

        // Comenzamos la observación
        observer.observe(parent, config);
    }

    function refreshCloseTabEvents() {
        document.querySelectorAll('.fa-window-close').forEach(item => {
            item.onclick = (e) => !confirm('Seguro Huamani??') && e.stopPropagation()
        })
    }

    function autoNotes() {
        let nota = document.querySelector('[data-ax-id*="_notes"], [id*="rcs_notes"]');
        // Modificar el valor del input
        if (nota.value == '') nota.value = 'fix';

        // Disparar un evento "input"
        let inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true,
        });
        nota.focus();
        nota.dispatchEvent(inputEvent);

        //autoSelectProy();
        clearCache();
    }

    // function autoSelectProy() {
    //     // PROYECTO
    //     let proyecto = document.querySelector('[data-ax-id="wic_dbscripts_js_funcs.project_code"]');
    //     proyecto.value = 'UNDEFINED'
    //     let inputEvent = new Event('input', {
    //         bubbles: true,
    //         cancelable: true,
    //     });
    //     proyecto.focus();
    //     proyecto.dispatchEvent(inputEvent);
    // }

    async function clearCache() {
        let btnDots = document.querySelector('.mdi-dots-vertical');
        if (btnDots) {
            let clickEvent = new Event('click', {
                bubbles: true,
                cancelable: true,
            });
            await btnDots.dispatchEvent(clickEvent);
            await btnDots.dispatchEvent(clickEvent);
        }
        let btnCache = document.querySelector('.mdi-memory') || [...document.querySelectorAll('.material-icons')].find(el => el.innerHTML == 'memory');
        if (btnCache) btnCache.click()
        else {
            let oldCacheURL = '/webOS/jobstool/';
            fetch(oldCacheURL).then(res => res.ok ? window.open(oldCacheURL) : null);
        }
    }

    function duplicateTab(e) {
        e.preventDefault();
        window.open(document.URL)
    }

    function openDBStudio(e) {
        e.preventDefault();

        let dbstudioURL = '/os/dbstudio#/databases';
        let oldDbstudioURL = '/webOS/dbstudio/';

        window.open(isOldErp ? oldDbstudioURL : dbstudioURL)
    }

    // Entorno antiguo
    function explorer() {
        if (isOldErp) {
            window.open('/webOS/explorer/');
        }
    }


    // NO FUNCIONA DEL TODO BIEN
    function nextResult(event) {
        event.preventDefault();

        if (isOldErp) {
            let elements = [...document.querySelectorAll('.x-panel.x-panel-noborder.x-border-panel')[2].querySelector('.x-grid3-scroller').firstElementChild.children]
            let selected = elements.find(el => el.classList.contains('x-grid3-row-selected'));
            if (selected) {
                selected.nextElementSibling.firstElementChild.click();
            } else {
                elements[0].firstElementChild.click();

            }
        } else {
            let selectedRow = document.querySelector(".v-window-item--active .ax-grid-selected-row") || document.querySelector(".v-window-item--active .ax-grid-row__selected");
            let nextRow = selectedRow.nextElementSibling;
            if (nextRow) {
                nextRow.firstElementChild.click();
            } else {
                selectedRow.parentNode.querySelector(".ax-grid-content-row").firstElementChild.click();
                //[...document.querySelectorAll('.x-panel.x-panel-noborder.x-border-panel')[2].querySelector('.x-grid3-scroller').firstElementChild.children].find( el => el.classList.contains('x-grid3-row-selected'))
            }
        }
    }

    function prevResult(event) {
        event.preventDefault();
        let selectedRow = document.querySelector(".v-window-item--active .ax-grid-selected-row") || document.querySelector(".v-window-item--active .ax-grid-row__selected");
        let prevRow = selectedRow.previousElementSibling;
        if (prevRow && !prevRow.classList.contains("ax-grid-row__control-width")) {
            prevRow.firstElementChild.click();
        } else {
            [...selectedRow.parentNode.querySelectorAll(".ax-grid-content-row")].at(-1).firstElementChild.click();
        }
    }

    function buscarPrimerNieto(elemento, clase) {
        let queue = [elemento]; // Cola de elementos a explorar
        let ultimoNoNulo = null; // Variable para almacenar el último valor no nulo

        while (queue.length > 0) {
            let elementoActual = queue.shift();
            let hijos = elementoActual.children;

            for (let i = 0; i < hijos.length; i++) {
                let hijo = hijos[i];

                // Verifica si el hijo tiene la clase deseada
                if (hijo.classList.contains(clase)) {
                    // Actualiza el valor del último no nulo encontrado
                    queue = [...hijo.children];
                    ultimoNoNulo = hijo;
                    break;
                }

                // Agrega el hijo a la cola para explorar sus hijos en la próxima iteración
                queue.push(hijo);
            }
        }

        // Al final del bucle, devuelve el último valor no nulo encontrado
        return ultimoNoNulo;
    }

    async function newTab() {
        // ABRIR TAB SOLO EN VNEXT
        let tab = document.querySelectorAll(".v-slide-group__content.v-tabs-bar__content")[1] || document.querySelectorAll(".v-slide-group__content.v-tabs-bar__content")[0];
        let active_tab = tab.querySelector('.v-tab.v-tab--active :first-child');


        let contextEvent = new Event('contextmenu', {
            bubbles: true,
            cancelable: true,
        });
        await active_tab.dispatchEvent(contextEvent);

        document.querySelector('.v-list-item__title').click();
        document.querySelector('.menuable__content__active .v-list-item__title').closest('[role="menu"]').style.display = 'none';

        openPDF();
    }

    function nextTab(event, del) {
        event.preventDefault();
        let tab = document.querySelectorAll(".v-slide-group__content.v-tabs-bar__content")[1] || document.querySelectorAll(".v-slide-group__content.v-tabs-bar__content")[0];
        tab = tab.querySelector('.v-tab.v-tab--active');
        if (del) return tab.lastElementChild.click();
        if (tab.nextElementSibling) {
            tab.nextElementSibling.click();
        } else {
            tab.parentNode.querySelector('.v-tab').click()
        }
    }

    async function textblaze() {
        arrCommands = await getCommands()
        let acum = ''
        let timer;
        document.addEventListener("keypress", function (event) {
            clearTimeout(timer);
            if (['Enter', ' '].includes(event.key)) {
                acum = ''
                return
            }
            acum += event.key
            let command = searchInStorage(acum);
            if ( command ) {
                console.log(event)
                event.preventDefault();
                acum = '';

                if( event.target.value ){
                    event.target.value = event.target.value.substring(0, event.target.selectionStart - 2) + command.code;
                    let inputEvent = new Event('input', {
                        bubbles: true,
                        cancelable: true,
                    });
                    event.target.dispatchEvent(inputEvent)
                }else{
                    event.target.innerHTML = event.target.innerHTML.substring(0, obtenerPosicionCursor(event.target) - 2) + command.code;

                    let range = document.createRange();
                    range.selectNodeContents(event.target);
                    range.collapse(false); // Colapsar el rango al final del contenido
                    
                    let selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);

                }

            }
            timer = setTimeout(() => {
                acum = ''
            }, 3000);
        });

        document.addEventListener("keyup", function (event) {
            clearTimeout(timer);
            if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
                acum = ''
                event.preventDefault()
            }
            if (event.target.value == '') {
                acum = ''
            }
            timer = setTimeout(() => {
                acum = ''
            }, 3000);
        })
    }

    

    function searchInStorage(pCommand) {
        return arrCommands.find(({ name }) => name == pCommand);
    }

    function obtenerPosicionCursor(div) {
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        var preRange = range.cloneRange();
        preRange.selectNodeContents(div);
        preRange.setEnd(range.startContainer, range.startOffset);
        var start = preRange.toString().length;
    
        return start;
    }
}

chrome.runtime.onMessage.addListener( async (msgObj) => {
    console.log('Entra Message Listener', msgObj)
    arrCommands = await getCommands();
});

async function getCommands() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['commands'], function (result) {
            if (result.commands === undefined) {
                reject();
            } else {
                resolve( result.commands );
            }
        });
    });
}