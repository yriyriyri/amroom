document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('user-input');
    const writingMessage = document.getElementById('writing-message');
    const writingMessageConsole = document.getElementById('writing-message-console');
    const messages = document.getElementById('messages');
    const consoleMessages = document.getElementById('messages-console');
    const promptLocation = '<span class="prompt-location">~</span>';
    const promptBling = '<span class="prompt-bling">$</span>';
    const promptAdmin = '<span class="prompt-admin">encryptedchatroooom@console</span>';
    const promptHiddenUser =  '<span class="prompt-hidden-user">encryptedchatroooom@hidden-user</span>';
    const terminalBar = document.getElementById('terminal__bar');
    const terminalBarConsole = document.getElementById('terminal__bar-console')
    const terminal = document.getElementById('terminal');
    const terminalConsole = document.getElementById('terminalconsole');
    
    const socket = new WebSocket('ws://localhost:3000'); //SWITCH TO WSS IN DEPLOYMENT WS IN TESTING
    //const cleanHTML = DOMPurify.sanitize(dirtyHTML);
    
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
    let sessionKey = 'default_session_key';
    let isKeyValid = false;
    let lastKeyChangeTime = 0;
    const keyChangeDelay = 10000; // 2 seconds
    
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
    
    openingscreen()
    help()

    writingMessage.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}`;
    writingMessageConsole.innerHTML = `${promptAdmin}${promptLocation}${promptBling}${consoleCursor}`;


    socket.addEventListener('message', function(event) {
        const message = event.data;
        console.log('Encrypted message:', message);
    
        decryptMessage(message, sessionKey)
            .then(decryptedMessage => {
                // console.log('Decrypted message:', decryptedMessage);
                if (decryptedMessage == 'Failed Decrypt'){
                    const hiddenUserOutput = `<span style="color: #000000; font-family: Ubuntu Mono; font-size: 16px;">${message}</span>`;
                    const warning = `<span style="color: #ff0000; font-family: Ubuntu Mono; font-size: 16px;">Session key invalid, cannot decrypt: Change session key</span>`;
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `${promptHiddenUser}${promptLocation}${promptBling}${hiddenUserOutput}${warning}`;
                    messages.appendChild(listItem);
                    messages.scrollTop = messages.scrollHeight;
                }else{
                    const parsedData = JSON.parse(decryptedMessage);
                    // console.log('Parsed data:', parsedData);
        
                    const listItem = document.createElement('li');
                    
                    if (parsedData.includes('<img')) {
                        const tempContainer = document.createElement('div');
                        tempContainer.innerHTML = parsedData; 
                        const img = tempContainer.querySelector('img');
                        
                        // Wait for the image to load before appending to the list
                        img.addEventListener('load', () => {
                            listItem.innerHTML = parsedData;
                            messages.appendChild(listItem);
                            messages.scrollTop = messages.scrollHeight; // scroll to the bottom
                        });
                        
                        img.src = img.src;
                    } else {
                        listItem.innerHTML = parsedData;
                        messages.appendChild(listItem);
                        messages.scrollTop = messages.scrollHeight; // scroll to the bottom
                    }
                }})
            .catch(error => {
                console.error('Error handling message:', error);
            });
    });
    

    async function sendMessage(message, parameter) {
        if (parameter) {
            const sanitizedMessage = sanitizeInput(message);
            socket.send(JSON.stringify(sanitizedMessage));
        } else {
            printCmdResponse('Invalid session key: can not send message')
        }
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
            currentText = `<span style="color: ${currentColor}; font-family: ${currentFont}; font-size: ${currentFontSize};">${sanitizeInput(userInput.value)}</span>`;
            promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;
            writingMessage.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${currentText}${cursor}`;
        }
        else {
            currentText = `<span style="color: #005353; font-family: Ubuntu Mono; font-size: 16px;">${sanitizeInput(userInput.value)}</span>`;
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
                    const InputText = `<span style="color: ${currentColor}; font-family: ${currentFont}; font-size: ${currentFontSize};">${sanitizeInput(inputText)}</span>`;
                    promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;
                    listItem.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${InputText}`;
                    sendMessage(listItem.innerHTML,isKeyValid)
                } else {
                    const listItem = document.createElement('li');
                    const InputText = `<span style="color: #005353; font-family: Ubuntu Mono; font-size: 16px;">${sanitizeInput(inputText)}</span>`;
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
        const commandArguments = args.join(' ').trim(); 

        switch (cmd) {
            case 'help':
                help()
                break;
            case 'clear':
                messages.innerHTML = ''; // clear the messages list
                break;
            case 'textcolor':
                if (isValidHexColor(commandArguments)) {
                    applyColor(commandArguments);
                } else {
                    printCmdResponse(`Invalid color code: ${commandArguments}`);
                }
                break;
            case 'usercolor':
                if (isValidHexColor(commandArguments)) {
                    applyUserColor(commandArguments);
                } else {
                    printCmdResponse(`Invalid color code: ${commandArguments}`);
                }
                break;
            case 'font':
                if (isValidFont(commandArguments)){
                    applyFont(commandArguments);
                } else {
                    printCmdResponse(`Invalid font: ${commandArguments}`);
                }
                break;
            case 'fontsize':
                if (isValidFontSize(commandArguments)){
                    applyFontSize(commandArguments);
                } else {
                    printCmdResponse(`Invalid font size: ${commandArguments}`);
                }
                break;
            case 'fontlist':
                printCmdResponse(`Font list: ${webSafeFonts} ${customFonts}`);
                break;
            case 'image':
                if (isValidImageUrl(commandArguments)) {
                    displayImage(commandArguments);
                } else {
                    printCmdResponse(`Invalid image URL: ${commandArguments}`);
                }
                break;
            case 'link':
                if (isValidUrl(commandArguments)) {
                    displayLink(commandArguments);
                } else {
                    printCmdResponse(`Invalid URL: ${commandArguments}`);
                }
                break;
            case 'username':
                applyUsername(commandArguments);
                break;
            case 'background':
                if (isValidImageUrl(commandArguments)){
                    applyBackground(commandArguments);
                } else {
                    printCmdResponse(`Invalid image URL: ${commandArguments}`);
                }
                break;
            case 'sessionkey':
                sessionKeyChange(commandArguments);
                break;
            default:
                printCmdResponse(`Unknown command: ${cmd}`);
                break;
        }
    }

    function help(){
        printCmdResponse(
            'Available commands:\n' +
            '1. /help - Display this help message.\n' +
            '2. /sessionkey <key> - Change the session key to the specified value.\n' +
            '3. /clear - Clear the messages list.\n' +
            '4. /username <name> - Set the username to the specified name.\n' +
            '5. /usercolor <hex> - Change the user text color to the specified hex code.\n' +
            '6. /textcolor <hex> - Change the text color to the specified hex code.\n' +
            '7. /font <font-name> - Change the font to the specified name.\n' +
            '8. /fontsize <size> - Change the font size to the specified value.\n' +
            '9. /fontlist - Display a list of available fonts.\n' +
            '10./image <url> - Display an image from the specified URL.\n' +
            '11./link <url> - Display a hyperlink to the specified URL.\n' +
            '12./background <url> - Change the background image to the specified URL.'
        );
    }
    
    function openingscreen() {
        const openingscreenstring = 
            `   _____                 .__  .__                __________                                   
      /  _  \\   _____   ____ |  | |__| ____   ______ \\______   \\ ____   ____   _____              
     /  /_\\  \\ /     \\_/ __ \\|  | |  |/ __ \\ /  ___/  |       _//  _ \\ /  _ \\ /     \\             
    /    |    \\  Y Y  \\  ___/|  |_|  \\  ___/ \\___ \\   |    |   (  <_> |  <_> )  Y Y  \\            
    \\____|__  /__|_|  /\\___  >____/__|\\___  >____  >  |____|_  /\\____/ \\____/|__|_|  / /\\  /\\  /\\ 
            \\/      \\/     \\/             \\/     \\/          \\/                    \\/  \\/  \\/  \\/ 
                                                                                             
    1> For commands /help in the console.\n
    2> You won't be able to see message content or send messages unless you have the session key. You can /sessionkey in the console to enter your key.\n
    3> Move + Change active window with the title bar`;
    
        const span = document.createElement('span');
        span.style.color = '#ff00ff';
        span.textContent = openingscreenstring;
    
        messages.appendChild(span);
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
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const urlObj = new URL(url);
        const fileExtension = urlObj.pathname.split('.').pop().toLowerCase();
        
        // check if the URL ends with a valid image extension
        return imageExtensions.includes(fileExtension);
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
        const maxSize = 500; 

        const sanitizedUrl = sanitizeInput(url);
    
        const imageElement = `<img src="${sanitizedUrl}" alt="User Image" style="max-width: ${maxSize}px; max-height: ${maxSize}px; height: auto; width: auto;" />`;
    
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = imageElement;
        const img = tempContainer.querySelector('img');
    
        img.addEventListener('load', () => {
            const promptUser = `<span class="prompt-user" style="color: ${currentUserColor};">mainroom@${currentUsername}:</span>`;
            listItem.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${imageElement}`;
    
            sendMessage(listItem.innerHTML, isKeyValid);
            messages.scrollTop = messages.scrollHeight;
        });
    
        img.src = url;
    }
     
    function displayLink(url) {
        const listItem = document.createElement('li');
        const sanitizedUrl = sanitizeInput(url);
        const linkElement = `<a href="${sanitizedUrl}" class="link" target="_blank">${sanitizedUrl}</a>`;
        listItem.innerHTML = `${hiddenChar}${promptUser}${promptLocation}${promptBling}${linkElement}`;
        if (activeTerminal === 'terminal'){
            sendMessage(listItem.innerHTML,isKeyValid)
            messages.scrollTop = messages.scrollHeight;
        }
        else{
            sendMessage(listItem.innerHTML,isKeyValid)
            messages.scrollTop = messages.scrollHeight;
        }
    }    

    function printCmdResponse(command) {
        const listItem = document.createElement('li');
        const CommandOutput = `<span style="color: #005353; font-family: Ubuntu Mono; font-size: 16px;">${command}</span>`;
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

    async function sessionKeyChange(key) {
        const now = Date.now();
        if (now - lastKeyChangeTime < keyChangeDelay) {
            printCmdResponse('Please wait before changing the key again.');
            return;
        }

        lastKeyChangeTime = now; // Update the last change time
        sessionKey = key;
        isKeyValid = await checkKey(key);

        if (isKeyValid) {
            isKeyValid = true
            printCmdResponse('Key is valid');
        } else {
            isKeyValid = false
            printCmdResponse('Key is invalid');
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

    function sanitizeInput(input) {
        return DOMPurify.sanitize(input);
    }
    
    async function decryptMessage(encryptedMessage, key) {
        try {
            const [ivHex, authTagHex, encryptedHex] = encryptedMessage.split(':');
            // console.log('IV:', ivHex, 'Auth Tag:', authTagHex, 'Encrypted Data:', encryptedHex);
    
            // convert hex strings to Uint8Array
            const iv = hexToUint8Array(ivHex);
            const authTag = hexToUint8Array(authTagHex);
            const encrypted = hexToUint8Array(encryptedHex);
    
            // console.log('IV Uint8Array:', iv, 'Auth Tag Uint8Array:', authTag, 'Encrypted Uint8Array:', encrypted);
    
            // combine encrypted data with auth tag (AES-GCM expects them together)
            const combinedData = new Uint8Array(encrypted.length + authTag.length);
            combinedData.set(encrypted);
            combinedData.set(authTag, encrypted.length);
    
            // console.log('Combined Encrypted Data:', combinedData);
    
            // import the key for decryption
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                hexToUint8Array(key),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );
    
            // console.log('CryptoKey imported successfully');
    
            // decrypt the message
            return crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: 128
                },
                cryptoKey,
                combinedData // Use the combined encrypted data and auth tag
            ).then(decryptedArrayBuffer => {
                // Convert ArrayBuffer to string
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(decryptedArrayBuffer);
            });
        } catch (error) {
            console.error('Decryption error:', error);
            return 'Failed Decrypt'
        }
    }
    
    async function checkKey(parameter) {
        try {
            const response = await fetch('http://localhost:3000/check-key', { //CALL PROPER DOMAIN UPON DEPLOYINH
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ parameter })
            });
    
            // Check if the response is ok (status in the range 200-299)
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const data = await response.json();
            return data.match; // This will be true or false based on the response
        } catch (error) {
            console.error('Error:', error);
            return false; // Return false in case of an error
        }
    }


    function hexToUint8Array(hex) {
        const len = hex.length;
        const arr = new Uint8Array(len / 2);
        for (let i = 0; i < len; i += 2) {
            arr[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return arr;
    }

    userInput.addEventListener('blur', function() {
        userInput.focus();
    });

});
