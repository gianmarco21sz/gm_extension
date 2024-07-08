(async ()=>{
    let arrCommands = await getCommands();
    let isEditing = false;
    let commandSelected = null;

    console.log(arrCommands)
    arrCommands.forEach(command => {
        addCommandToList(command.name, command.code);
    });


    document.getElementById('commandForm').addEventListener('submit', async function (event) {
        console.log('SUBMIT')
        event.preventDefault();

        const name = document.getElementById('commandName').value;
        const code = document.getElementById('commandCode').value;

        if (name && code) {
            if(isEditing){
                editCommand(commandSelected, name, code);
            }else{
                await saveInStorage({ name, code });
                addCommandToList(name, code);
            }
            document.getElementById('commandForm').reset();
        }
        console.log('SUBMIT')
    });

    async function saveInStorage(pObj) {
        
        let commands = await getCommands();
        commands.push(pObj);
        chrome.storage.sync.set({ 'commands': commands }, async function () {
        });

        refreshContentJS();
    }

    async function getCommands() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(['commands'], function (result) {
                resolve(result.commands || []);
            });
        })
    }

    function addCommandToList(name, code) {
        const commandList = document.querySelector('.command-list');

        const commandDiv = document.createElement('div');
        commandDiv.className = 'command bg-gray-800 p-4 rounded-lg shadow-md mb-4 relative';

        const commandName = document.createElement('h3');
        commandName.className = 'text-lg font-semibold';
        commandName.textContent = name;
        commandDiv.appendChild(commandName);

        const commandCode = document.createElement('pre');
        commandCode.className = 'mt-2 p-2 bg-gray-700 rounded-lg';
        commandCode.textContent = code;
        commandDiv.appendChild(commandCode);

        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.className = 'edit-button absolute top-2 right-2 text-yellow-500 hover:text-yellow-600 focus:outline-none';
        editButton.addEventListener('click', function () {
            isEditing = true;
            commandSelected = commandDiv;
            document.getElementById('commandName').value = name;
            document.getElementById('commandCode').value = code;
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.className = 'delete-button absolute top-2 right-10 text-red-500 hover:text-red-600 focus:outline-none';
        deleteButton.addEventListener('click', async function () {
            if(!confirm('Seguro de eliminar??')) return;
            let commands = await getCommands();
            commands = commands.filter(command => command.name !== name);
            chrome.storage.sync.set({ 'commands': commands }, async function () {
                commandList.removeChild(commandDiv);
            });

            refreshContentJS();
        });

        commandDiv.appendChild(deleteButton);

        commandDiv.appendChild(editButton);

        commandList.appendChild(commandDiv);
    }

    async function editCommand(commandSelected, name, code) {

        if (name !== null && code !== null) {
            
            let commands = await getCommands();
            commands = commands.map(command => {
                if (command.name == commandSelected.querySelector('h3').textContent) {
                    command.name = name;
                    command.code = code;
                }
                return command;
            });
            
            chrome.storage.sync.set({ 'commands': commands }, async function () {
                isEditing = false;
                commandSelected.querySelector('h3').textContent = name;
                commandSelected.querySelector('pre').textContent = code;
            });
            refreshContentJS()
        }
    }

    function refreshContentJS(){
        chrome.tabs.query({}, function(tabs) {
            console.log(tabs)
            tabs.forEach( tab => {
                chrome.tabs.sendMessage(tab.id, {type:"getText"}, function(response){
                    console.log('SEND MESSAGE', response);
                });
            })
        });
    }
})();

