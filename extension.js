    let arrNodes = [];
    let url = document.URL.split('/');
    console.log('TEST GIT')
    
    if (url.includes('kanban_deister') && url.includes('kanban') && url.includes('rest')) {
        // Llenar textarea con el formato para imputar horas
        let btn = document.querySelector('#appBarScrollTarget button');

        let interval = setInterval(() => {
            console.log('INTERVAL')
            btn = document.querySelector('#appBarScrollTarget button');
            if (btn) {
                btn.addEventListener('click', setTimeSheetFormat)
                clearInterval(interval);
            }
        }, 1000)
    }

    // Evitar cerrar dbstudio
    if (document.URL.indexOf("dbstudio") != -1) {
        window.addEventListener('beforeunload', (event) => {
            event.preventDefault();
            event.returnValue = '';
        });
        openPDF();
    }

    document.addEventListener("keydown", function(event) {
        // Ejecutar en dbStudio shift + enter ( Probado en : estandar, next, y algunos entornos antiguos[ sando, bp, baqueira, saas])
        if (event.shiftKey && event.keyCode === 13) {
            event.preventDefault();
            let icon = document.querySelector(".v-window-item--active>.dbstudio-flex-header-body .fa.fa-play");
            let barra = document.getElementsByClassName("x-panel-bbar")[1];
            //let oldERP = [...document.querySelectorAll('[id*="btnInnerEl"]')].find(el => el.innerHTML == 'Execute');
            let oldERP = [...document.querySelectorAll('[id*="btnInnerEl"]')].filter(el => el.innerHTML == 'Execute').find( el => !el.closest('.x-panel.x-tabpanel-child.x-panel-default').style['display']  )

            if (icon) {
                icon.closest('button').click()
            } else if (barra) {
                [...barra.getElementsByTagName("button")].at(-1).click();
            } else if (oldERP) {
                let textarea = document.querySelector('textarea');
                oldERP.click();
                // x-item-disabled
                let tmp_interval = setInterval( () => {
                    if( !oldERP.closest('a').classList.contains('x-item-disabled') ){
                        textarea.focus();
                        clearInterval(tmp_interval);
                    }
                },1000);
            } else {
                buscarPrimerNieto(document.querySelector('.v-window-item--active'), 'v-window-item--active').querySelector('.fa.fa-play').click();
            }
        }

        // Auto-fix
        //let btnSave = document.querySelector('.v-icon.mdi.mdi-content-save-outline') || [...document.querySelectorAll('.v-icon.material-icons')].find(el => el.innerHTML == 'save');
        let btnSave = document.activeElement.closest('.v-window-item--active')?.querySelector('.v-icon.mdi.mdi-content-save-outline') || document.querySelector('.v-icon.mdi.mdi-content-save-outline') || [...document.querySelectorAll('.v-icon.material-icons')].find(el => el.innerHTML == 'save');
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
                    duplicateTab();
                    break;
                    // O
                case 79:
                    openDBStudio();
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
        // POR EL MOMENTO SOLO FUNCIONA CON 1
        // Seleccionamos el elemento <ul> que queremos observar
        let targetNode = [...document.querySelectorAll(".editor-resultset-container")].at(-1);
        // Creamos una función de devolución de llamada (callback) para manejar las mutaciones observadas
        const callback = function(mutationsList, observer) {
            console.log(mutationsList)
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    console.log('Nodos añadidos:', mutation.addedNodes);
                    for (let node of mutation.addedNodes) {
                        if (node && node.nodeName && node.nodeName != '#comment' && node.classList.contains('active-tab-rs')) {
                            node.querySelectorAll('table tbody tr').forEach(row => {
                                let icon = row.querySelector('.v-icon.notranslate.mdi.mdi-content-save');
                                if (icon) {
                                    icon.closest('a').removeAttribute('download');
                                    icon.closest('a').setAttribute('target', 'blank');
                                }
                                // if (icon) {
                                //     icon.addEventListener('click', (e) => {
                                //         e.preventDefault();
                                //         window.open(e.target.closest('a').href);
                                //     });
                                // }
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
                console.log(arrNodes);
            } else {
                targetNode = [...document.querySelectorAll(".editor-resultset-container")].at(-1);
            }
        }, 1000);
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
        clearCache();
    }


    function clearCache() {
        let btnCache = document.querySelector('.mdi-memory') || [...document.querySelectorAll('.material-icons')].find(el => el.innerHTML == 'memory');
        btnCache.click();
    }

    function duplicateTab(){
        window.open(document.URL)
    }

    function openDBStudio(){
        //let dbstudioURL = document.URL.includes('webOS') ? '/webOS/dbstudio/' : '/os/dbstudio#/databases'
        let dbstudioURL = '/os/dbstudio#/databases';
        let oldDbstudioURL = '/webOS/dbstudio/';
        fetch(dbstudioURL).then( res => {
            if(res.ok){
                window.open(dbstudioURL);
            }else{
                window.open(oldDbstudioURL);
            }       
        })
    }

    // Entorno antiguo
    function explorer(){
        fetch('/webOS/dbstudio/').then( res => {
            if(res.ok){
                //window.location.href = '/webOS/explorer/';
                window.open('/webOS/explorer/');
            }     
        })
    }

    function setTimeSheetFormat() {
        let txtArea = document.querySelector('.v-dialog--active textarea');
        txtArea.value = '- Nombre: \n- Solicitante: \n- Descripción: \n- Estado actual: \n- Ubicación :';
        txtArea.focus();

        let inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true,
        });
        txtArea.dispatchEvent(inputEvent);
        txtArea.setSelectionRange(10, 10);
    }


    // NO FUNCIONA DEL TODO BIEN
    function nextResult(event) {
        event.preventDefault();
        let selectedRow = document.querySelector(".v-window-item--active .ax-grid-selected-row") || document.querySelector(".v-window-item--active .ax-grid-row__selected");
        let nextRow = selectedRow.nextElementSibling;
        if (nextRow) {
            nextRow.firstElementChild.click();
        } else {
            selectedRow.parentNode.querySelector(".ax-grid-content-row").firstElementChild.click();
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
    
