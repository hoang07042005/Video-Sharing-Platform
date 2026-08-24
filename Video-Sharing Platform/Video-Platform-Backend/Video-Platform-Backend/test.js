
fetch('http://localhost:5139/api/livestreams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        channelId: '69014f42-24ca-4fe8-8d05-7dcf2d9ef91c',
        title: 'Test Stream'
    })
}).then(res => res.text()).then(text => console.log(text)).catch(err => console.error(err));

