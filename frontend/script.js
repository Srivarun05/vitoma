    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });

    // Array to hold the files for processing
    let selectedFiles = [];

    // Function to handle file selection
    document.getElementById('imageFiles').addEventListener('change', (event) => {
        const imageListDiv = document.getElementById('imageList');
        imageListDiv.innerHTML = ''; // Clear previous images
        selectedFiles = Array.from(event.target.files); // Update selected files

        selectedFiles.forEach((file, index) => {
            const imgDiv = document.createElement('div');
            const img = document.createElement('img');
            const deleteBtn = document.createElement('button');

            const fileReader = new FileReader();
            fileReader.onload = function (e) {
                img.src = e.target.result;
            };
            fileReader.readAsDataURL(file);

            // Add delete button
            deleteBtn.textContent = "X";
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {
                selectedFiles.splice(index, 1); // Remove from file array
                imgDiv.remove(); // Remove from UI
            });

            imgDiv.appendChild(img);
            imgDiv.appendChild(deleteBtn);
            imageListDiv.appendChild(imgDiv);
        });
    });

    // Function to create a video from the selected images
    document.getElementById('createVideoButton').addEventListener('click', async () => {
        if (selectedFiles.length === 0) {
            alert('Please select images to create a video.');
            return;
        }

        try {
            // Load FFmpeg
            if (!ffmpeg.isLoaded()) {
                console.log('Loading FFmpeg...');
                await ffmpeg.load();
                console.log('FFmpeg loaded successfully.');
            }

            // Add images to FFmpeg virtual file system
            for (let i = 0; i < selectedFiles.length; i++) {
                ffmpeg.FS('writeFile', `image${i}.png`, await fetchFile(selectedFiles[i]));
            }

            // Create an input text file for FFmpeg concatenation
            const concatList = selectedFiles.map((_, i) => `file 'image${i}.png'`).join('\n');
            ffmpeg.FS('writeFile', 'filelist.txt', new TextEncoder().encode(concatList));

            // Generate video from images
            console.log('Creating video...');
            await ffmpeg.run(
                '-f', 'concat',
                '-safe', '0',
                '-i', 'filelist.txt',
                '-pix_fmt', 'yuv420p',
                'output.mp4'
            );

            // Retrieve video file
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });

            // Show download link
            const downloadLink = document.getElementById('downloadLink');
            downloadLink.href = URL.createObjectURL(videoBlob);
            downloadLink.style.display = 'block';
            alert('Video created successfully!');
        } catch (error) {
            console.error('Error during video creation:', error);
            alert('An error occurred while creating the video. Please try again.');
        }
    });