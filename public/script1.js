document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('user-input');
    const writingMessage = document.getElementById('writing-message');
    const writingMessageConsole = document.getElementById('writing-message-console');
    const messages = document.getElementById('messages');
    const consoleMessages = document.getElementById('messages-console');
    const promptLocation = '<span class="prompt-location">~</span>';
    const promptBling = '<span class="prompt-bling">$</span>';
    const promptAdmin = '<span class="prompt-admin">encryptedchatroooom@console</span>';
    const terminalBar = document.getElementById('terminal__bar');
    const terminalBarConsole = document.getElementById('terminal__bar-console')
    const terminal = document.getElementById('terminal');
    const terminalConsole = document.getElementById('terminalconsole');
    
    const socket = new WebSocket('ws://localhost:3000');

    let currentColor = getRandomHexColor();
    applyColor(currentColor)
    let currentUserColor = getRandomHexColor();
    let currentUsername = getRandomUsername();


    // let currentColor = '#ffffff';
    // let currentUserColor = '#002323';
    // let currentUsername = 'temp-username'
    let currentFont = 'Ubuntu Mono';
    let currentFontSize = 16;
    let currentText = '';
    let sessionKey = 'floss2024';
    
    // web-safe fonts
    const webSafeFonts = [
        'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New', 
        'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 
        'Trebuchet MS', 'Arial Black', 'Impact', 'Tahoma', 'Geneva', 
        'Sans-Serif', 'Serif', 'Monospace'
    ];

    // custom fonts (imported via @import or @font-face) ADD NEW FONTS
    const customFonts = [
        'Ubuntu', 'Ubuntu Mono', 'Tangerine', 'Mrs Saint Delafield'
    ];

    let cursor = `<span id="terminal__prompt--cursor" style="height: 0.8em; animation: blink 1200ms linear infinite;"></span>`;
    let consoleCursor = `<span id="terminal__prompt--consolecursor" style="height: 0.8em; animation: consoleblink 1200ms linear infinite;"></span>`
    let promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;

    let isDragging = false;
    let offsetX = 100;
    let offsetY = 100;
    let draggingTerminal = null;
    let activeTerminal = 'terminalConsole';
    let hiddenChar = `<span style="font-size: ${currentFontSize}px; font-family: ${currentFont}"></span>`;
    
    writingMessage.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}`;
    writingMessageConsole.innerHTML = `${promptAdmin}${promptLocation}${promptBling}${consoleCursor}`;


    socket.addEventListener('message', function(event) {
        const message = event.data;
        const parsedData = JSON.parse(message);
        
        const decryptedMessage = decryptMessage(parsedData.message, sessionKey);
    
        const listItem = document.createElement('li');
        if (decryptedMessage.includes('<img')) {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = decryptedMessage;
            const img = tempContainer.querySelector('img');
            
            img.addEventListener('load', () => {
                listItem.innerHTML = decryptedMessage;
                messages.appendChild(listItem);
                messages.scrollTop = messages.scrollHeight;
            });
        
            img.src = img.src;
        } else {
            listItem.innerHTML = decryptedMessage;
            messages.appendChild(listItem);
            messages.scrollTop = messages.scrollHeight;
        }
    });
    

    function sendMessage(message) {
        socket.send(JSON.stringify(message));
    }
    
    userInput.focus();

    terminalBar.addEventListener('mousedown', function(event) {
        // printCmdResponse(CurrentText)
        startDragging(event, terminal);
        if (activeTerminal === 'terminalConsole'){
            userInput.value = ''
            currentText = ''
        }
        // printCmdResponse(CurrentText)
        activeTerminal = 'terminal';
        terminal.style.zIndex = 2;
        terminalConsole.style.zIndex = 1;
        writingMessageConsole.innerHTML = `${promptAdmin}${promptLocation}${promptBling}`;
        writingMessage.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${currentText}${cursor}`;
    });

    terminalBarConsole.addEventListener('mousedown', function(event) {
        // printCmdResponse(CurrentText)
        startDragging(event, terminalConsole);
        if (activeTerminal === 'terminal'){
            userInput.value = ''
            currentText = ''
        }
        // printCmdResponse(CurrentText)
        activeTerminal = 'terminalConsole';
        terminal.style.zIndex = 1;
        terminalConsole.style.zIndex = 2;
        writingMessage.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}`;
        writingMessageConsole.innerHTML = `${promptAdmin}${promptLocation}${promptBling}${currentText}${consoleCursor}`;
    });

    userInput.addEventListener('input', function() {
        if (activeTerminal === 'terminal') {
            currentText = `<span style="color: ${currentColor}; font-family: ${currentFont}; font-size: ${currentFontSize};">${userInput.value}</span>`;
            promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;
            writingMessage.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${currentText}${cursor}`;
        }
        else {
            currentText = `<span style="color: #880000; font-family: Ubuntu Mono; font-size: 16px;">${userInput.value}</span>`;
            writingMessageConsole.innerHTML = `${promptAdmin}${promptLocation}${promptBling}${currentText}${consoleCursor}`;
        }
    });

    userInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            let inputText = userInput.value.trim();
            if (activeTerminal === 'terminalConsole' && !inputText.startsWith('/')){
                inputText = ('/' + inputText)
            }
            if (inputText.startsWith('/')) {
                processCommand(inputText.slice(1)); //removebackslash
            } 
            else {
                if (activeTerminal === 'terminal'){
                    const listItem = document.createElement('li');
                    const InputText = `<span style="color: ${currentColor}; font-family: ${currentFont}; font-size: ${currentFontSize};">${inputText}</span>`;
                    promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;
                    listItem.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${InputText}`;
                    innerHTMLString = '${hiddenChar}${promptUser}${promptLocation}${promptBling}${InputText}';
                    sendMessage(listItem.innerHTML)
                } else {
                    const listItem = document.createElement('li');
                    const InputText = `<span style="color: #880000; font-family: Ubuntu Mono; font-size: 16px;">${inputText}</span>`;
                    listItem.innerHTML = `${promptAdmin}${promptLocation}${promptBling}${InputText}`;
                    consoleMessages.appendChild(listItem);
                }
                
            }

            userInput.value = '';
            currentText = '';
            if (activeTerminal === 'terminal'){
                promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;
                writingMessage.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${currentText}${cursor}`;
            }
            
            else {
                writingMessageConsole.innerHTML = `${promptAdmin}${promptLocation}${promptBling}${currentText}${consoleCursor}`;
            }

            // scroll to the bottom of the messages
            messages.scrollTop = messages.scrollHeight;
            consoleMessages.scrollTop = consoleMessages.scrollHeight;
        }
    });

    function processCommand(command) {
        const [cmd, ...args] = command.split(' '); // split command into parts
        const arguments = args.join(' ').trim(); 

        switch (cmd) {
            case 'help':
                printCmdResponse('Help command received');
                break;
            case 'clear':
                messages.innerHTML = ''; // clear the messages list
                break;
            case 'color':
                if (isValidHexColor(arguments)) {
                    applyColor(arguments);
                } else {
                    printCmdResponse(`Invalid color code: ${arguments}`);
                }
                break;
            case 'usercolor':
                if (isValidHexColor(arguments)) {
                    applyUserColor(arguments);
                } else {
                    printCmdResponse(`Invalid color code: ${arguments}`);
                }
                break;
            case 'font':
                if (isValidFont(arguments)){
                    applyFont(arguments);
                } else {
                    printCmdResponse(`Invalid font: ${arguments}`);
                }
                break;
            case 'fontsize':
                if (isValidFontSize(arguments)){
                    applyFontSize(arguments);
                } else {
                    printCmdResponse(`Invalid font size: ${arguments}`);
                }
                break;
            case 'fontlist':
                printCmdResponse(`Font list: ${webSafeFonts} ${customFonts}`);
                break;
            case 'image':
                if (isValidImageUrl(arguments)) {
                    displayImage(arguments);
                } else {
                    printCmdResponse(`Invalid image URL: ${arguments}`);
                }
                break;
            case 'link':
                if (isValidUrl(arguments)) {
                    displayLink(arguments);
                } else {
                    printCmdResponse(`Invalid URL: ${arguments}`);
                }
                break;
            case 'username':
                applyUsername(arguments);
                break;
            case 'background':
                if (isValidImageUrl(arguments)){
                    applyBackground(arguments);
                } else {
                    printCmdResponse(`Invalid image URL: ${arguments}`);
                }
                break;
            default:
                printCmdResponse(`Unknown command: ${cmd}`);
                break;
        }
    }
    
    function isValidHexColor(color) {
        return /^#[0-9A-Fa-f]{6}$/.test(color);
    }

    function isValidFont(font) {  
        // check if font is either webSafe or customFonts
        return webSafeFonts.includes(font) || customFonts.includes(font);
    }
    
    function isValidFontSize(fontsize) {
        const parsedSize = parseInt(fontsize, 10);
        return !isNaN(parsedSize) && parsedSize > 6 && parsedSize < 31;
    }

    function isValidImageUrl(url) {
        return /^(http|https):\/\/[^ "]+$/.test(url);
    }

    function isValidUrl(url) {
        return /^(http|https):\/\/[^ "]+$/.test(url);
    }    
    
    function applyColor(color) {
        currentColor = color;
        
        const styleSheet = document.styleSheets[0];
        const blinkKeyframes = `
          @keyframes blink {
            0%, 49% {
              background: ${color};
            }
            50%, 100% {
              background: transparent;
            }
          }
        `;

        for (let i = 0; i < styleSheet.cssRules.length; i++) {
            if (styleSheet.cssRules[i].name === 'blink') {
                styleSheet.deleteRule(i);
            }
        }
        
        styleSheet.insertRule(blinkKeyframes, styleSheet.cssRules.length);

        const cursorElement = document.querySelector('#terminal__prompt--cursor');
        if (cursorElement) {
            cursorElement.style.animation = 'none';  // Remove the animation
            cursorElement.offsetHeight;  // Force reflow (triggers a repaint)
            cursorElement.style.animation = 'blink 1200ms linear infinite';  // Reapply the new animation
        }
    }
    
    function applyUserColor(color){
        currentUserColor = color

    }

    function applyUsername(username){
        currentUsername = ('user-' + username)
    }

    function applyFont(font){
        currentFont = font
        hiddenChar = `<span style="font-family: ${font}"></span>`;
    }

    function applyFontSize(fontsize) {
        const sizeWithUnit = `${parseInt(fontsize, 10)}px`;
        currentFontSize = sizeWithUnit; 
        hiddenChar = `<span style="font-size: ${sizeWithUnit};"></span>`;
    }

    function applyBackground(url) {
        document.body.style.backgroundImage = `url(${url})`;
    }

    function displayImage(url) {
        const listItem = document.createElement('li');
        const imageElement = `<img src="${url}" alt="User Image" style="max-width: 100%; height: auto;" />`;
    
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = imageElement;
        const img = tempContainer.querySelector('img');
    
        img.addEventListener('load', () => {
            promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;
            listItem.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${imageElement}`;
            
            if (activeTerminal === 'terminal') {
                sendMessage(listItem.innerHTML);
                messages.scrollTop = messages.scrollHeight;
            } else {
                sendMessage(listItem.innerHTML);
                messages.scrollTop = messages.scrollHeight;
            }
        });
    
        img.src = url;
    }
    
    function displayLink(url) {
        const listItem = document.createElement('li');
        const linkElement = `<a href="${url}" class="link" target="_blank">${url}</a>`;
        listItem.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${linkElement}`;
        if (activeTerminal === 'terminal'){
            sendMessage(listItem.innerHTML)
            messages.scrollTop = messages.scrollHeight;
        }
        else{
            sendMessage(listItem.innerHTML)
            messages.scrollTop = messages.scrollHeight;
        }
    }    

    function printCmdResponse(command) {
        const listItem = document.createElement('li');
        const CommandOutput = `<span style="color: #880000; font-family: Ubuntu Mono; font-size: 16px;">${command}</span>`;
        listItem.innerHTML = `${promptAdmin}${promptLocation}${promptBling}${CommandOutput}`;
        consoleMessages.appendChild(listItem);
        setTimeout(() => {
            consoleMessages.scrollTop = consoleMessages.scrollHeight;
        }, 0);
    }

    function onMouseMove(event) {
        if (isDragging && draggingTerminal) {
            draggingTerminal.style.left = `${event.clientX - offsetX}px`;
            draggingTerminal.style.top = `${event.clientY - offsetY}px`;
        }
    }

    function onMouseUp() {
        isDragging = false;
        draggingTerminal = null;  
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    function startDragging(event, terminalElement) {
        isDragging = true;
        draggingTerminal = terminalElement; 
        offsetX = event.clientX - draggingTerminal.getBoundingClientRect().left;
        offsetY = event.clientY - draggingTerminal.getBoundingClientRect().top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function getRandomHexColor() {
        let randomColor = Math.floor(Math.random() * 16777215).toString(16);
        return `#${randomColor.padStart(6, '0')}`;
    }

    function getRandomUsername(length = 15) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:\'",.<>?/|\\';
        let username = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            username += characters[randomIndex];
        }
        username = ('user-' + username)
        return username;
    }

    async function decryptMessage(encrypted, key) {
        const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
        const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const authTag = new Uint8Array(authTagHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const encryptedArray = new Uint8Array(encryptedData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
        try {
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw', 
                new TextEncoder().encode(key), // Convert key to ArrayBuffer
                { name: 'AES-GCM' }, 
                false, 
                ['decrypt']
            );
    
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv, 
                    additionalData: authTag, // Auth Tag passed here
                    tagLength: 128 // GCM tag length in bits
                },
                cryptoKey,
                encryptedArray.buffer
            );
    
            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            return 'Decryption failed';
        }
    }    
    

    userInput.addEventListener('blur', function() {
        userInput.focus();
    });

});
