
 console.log('loaded');   



function readBlob() {

    var files = document.getElementById('files').files;
    if (!files.length) {
        alert('Please select a file!');
        return;
    }

    var file = files[0];
    var start = 0;
    var stop = file.size - 1;

    var reader = new FileReader();

    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) {
            document.getElementById('byte_content').textContent = evt.target.result;
            var upload = evt.target.result;
            var protocol = JSON.parse(upload);
            console.log(protocol);
        }
    };

    var blob = file;
    reader.readAsBinaryString(blob);
}


