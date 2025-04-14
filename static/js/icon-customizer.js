// Home Icon Customizer
document.addEventListener('DOMContentLoaded', function() {
    // Check if home icon exists
    const homeIcon = document.getElementById('home-icon');
    const homeIconImg = document.getElementById('home-icon-img');
    
    if (homeIcon && homeIconImg) {
        // Create color picker button
        const colorPickerBtn = document.createElement('button');
        colorPickerBtn.textContent = 'Customize Icon';
        colorPickerBtn.className = 'icon-customize-btn';
        colorPickerBtn.style.position = 'absolute';
        colorPickerBtn.style.top = '60px';
        colorPickerBtn.style.left = '10px';
        colorPickerBtn.style.zIndex = '101';
        colorPickerBtn.style.backgroundColor = '#4CAF50';
        colorPickerBtn.style.color = 'white';
        colorPickerBtn.style.border = 'none';
        colorPickerBtn.style.borderRadius = '4px';
        colorPickerBtn.style.padding = '5px 10px';
        colorPickerBtn.style.cursor = 'pointer';
        colorPickerBtn.style.display = 'none';
        
        // Add button to the page
        document.body.appendChild(colorPickerBtn);
        
        // Show button on hover
        homeIcon.addEventListener('mouseenter', function() {
            colorPickerBtn.style.display = 'block';
        });
        
        homeIcon.addEventListener('mouseleave', function(e) {
            // Check if mouse is over the button
            if (e.relatedTarget !== colorPickerBtn) {
                colorPickerBtn.style.display = 'none';
            }
        });
        
        colorPickerBtn.addEventListener('mouseleave', function(e) {
            // Check if mouse is over the home icon
            if (e.relatedTarget !== homeIcon) {
                colorPickerBtn.style.display = 'none';
            }
        });
        
        // Create color picker modal
        const modal = document.createElement('div');
        modal.className = 'icon-customize-modal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.zIndex = '1000';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'icon-customize-modal-content';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.width = '300px';
        modalContent.style.maxWidth = '90%';
        
        // Create color picker
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#4CAF50';
        colorPicker.style.width = '100%';
        colorPicker.style.marginBottom = '15px';
        
        // Create size slider
        const sizeLabel = document.createElement('label');
        sizeLabel.textContent = 'Icon Size:';
        sizeLabel.style.display = 'block';
        sizeLabel.style.marginBottom = '5px';
        
        const sizeSlider = document.createElement('input');
        sizeSlider.type = 'range';
        sizeSlider.min = '16';
        sizeSlider.max = '48';
        sizeSlider.value = '24';
        sizeSlider.style.width = '100%';
        sizeSlider.style.marginBottom = '15px';
        
        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.backgroundColor = '#4CAF50';
        saveBtn.style.color = 'white';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '4px';
        saveBtn.style.padding = '8px 15px';
        saveBtn.style.marginRight = '10px';
        saveBtn.style.cursor = 'pointer';
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.backgroundColor = '#f44336';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.padding = '8px 15px';
        cancelBtn.style.cursor = 'pointer';
        
        // Add elements to modal
        modalContent.appendChild(document.createElement('h3')).textContent = 'Customize Home Icon';
        modalContent.appendChild(document.createElement('p')).textContent = 'Choose a color:';
        modalContent.appendChild(colorPicker);
        modalContent.appendChild(sizeLabel);
        modalContent.appendChild(sizeSlider);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);
        modalContent.appendChild(buttonContainer);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Show modal when button is clicked
        colorPickerBtn.addEventListener('click', function() {
            modal.style.display = 'flex';
        });
        
        // Hide modal when cancel is clicked
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Save icon customization
        saveBtn.addEventListener('click', function() {
            const color = colorPicker.value;
            const size = sizeSlider.value;
            
            // Update icon color by modifying the SVG content
            fetch(homeIconImg.src)
                .then(response => response.text())
                .then(svgContent => {
                    // Replace fill color
                    const updatedSvg = svgContent.replace(/fill="[^"]*"/, `fill="${color}"`);
                    
                    // Create a blob from the modified SVG
                    const blob = new Blob([updatedSvg], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    
                    // Update the image source
                    homeIconImg.src = url;
                    
                    // Update size
                    homeIconImg.style.width = `${size}px`;
                    homeIconImg.style.height = `${size}px`;
                    
                    // Save preferences to localStorage
                    localStorage.setItem('homeIconColor', color);
                    localStorage.setItem('homeIconSize', size);
                    
                    // Hide modal
                    modal.style.display = 'none';
                });
        });
        
        // Load saved preferences
        const savedColor = localStorage.getItem('homeIconColor');
        const savedSize = localStorage.getItem('homeIconSize');
        
        if (savedColor || savedSize) {
            if (savedColor) {
                colorPicker.value = savedColor;
                
                // Update icon color
                fetch(homeIconImg.src)
                    .then(response => response.text())
                    .then(svgContent => {
                        const updatedSvg = svgContent.replace(/fill="[^"]*"/, `fill="${savedColor}"`);
                        const blob = new Blob([updatedSvg], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(blob);
                        homeIconImg.src = url;
                    });
            }
            
            if (savedSize) {
                sizeSlider.value = savedSize;
                homeIconImg.style.width = `${savedSize}px`;
                homeIconImg.style.height = `${savedSize}px`;
            }
        }
    }
});
