const allUsernames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"];


// function getUnavailablenames() {
    
// }
// function getavailablenames() {
    
// }


function populateNames() {
    const containerA = document.getElementById('containerA');
    const containerB = document.getElementById('containerB');

    // let availableNames = getavailableNames();
    // let unavailableNames = getunavailableNames();

    allUsernames.forEach(username => {
        const userB = document.createElement('button');
        userB.textContent = username;
        userB.addEventListener('click', () => {
            // if (!unavailableNames.includes(username)) {
            //     // send to index.html
            // }
        });

        // if (availableNames.includes(username)) {
            containerA.appendChild(userB);
        // } else if (unavailableNames.includes(username)) {
            containerB.appendChild(userB);
            userB.disabled = true;
        // }
    });
}

populateNames();

