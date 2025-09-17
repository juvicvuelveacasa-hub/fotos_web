class PhotoFormManager {
  constructor() {
    this.form = document.getElementById('photoForm');
    this.imageInput = document.getElementById('imageInput');
    this.uploadArea = document.getElementById('uploadArea');
    this.imagePreview = document.getElementById('imagePreview');
    this.successModal = document.getElementById('successModal');
    this.loadingModal = document.getElementById('loadingModal');
    this.selectedImages = [];
    this.maxImages = 20;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Eventos del formulario
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Eventos de carga de imágenes
    this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    // Drag and drop
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    this.uploadArea.addEventListener('click', () => this.imageInput.click());
    
    // Botones
    document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
    document.getElementById('newForm').addEventListener('click', () => this.newForm());
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id);
      }
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    this.uploadArea.classList.add('drag-over');
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.uploadArea.classList.remove('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    this.uploadArea.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    this.processFiles(files);
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.processFiles(files);
  }

  processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      this.showMessage('Por favor selecciona solo archivos de imagen', 'warning');
      return;
    }

    if (this.selectedImages.length + imageFiles.length > this.maxImages) {
      this.showMessage(`Máximo ${this.maxImages} imágenes permitidas`, 'warning');
      return;
    }

    imageFiles.forEach(file => {
      if (file.size > this.maxFileSize) {
        this.showMessage(`La imagen ${file.name} es muy grande (máximo 5MB)`, 'warning');
        return;
      }

      this.addImage(file);
    });
  }

  addImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageData = {
        file: file,
        data: e.target.result,
        type: file.type,
        name: file.name,
        id: Date.now() + Math.random()
      };
      
      this.selectedImages.push(imageData);
      this.renderImagePreview();
      this.updateUploadArea();
    };
    
    reader.readAsDataURL(file);
  }

  renderImagePreview() {
    this.imagePreview.innerHTML = '';
    
    if (this.selectedImages.length === 0) {
      return;
    }

    const header = document.createElement('h3');
    header.textContent = `Imágenes seleccionadas (${this.selectedImages.length})`;
    this.imagePreview.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'image-grid';

    this.selectedImages.forEach((image, index) => {
      const imageCard = document.createElement('div');
      imageCard.className = 'image-card';
      
      imageCard.innerHTML = `
        <div class="image-wrapper">
          <img src="${image.data}" alt="${image.name}">
          <button type="button" class="remove-btn" onclick="photoManager.removeImage(${index})">
            ×
          </button>
        </div>
        <div class="image-info">
          <p class="image-name">${image.name}</p>
          <p class="image-size">${this.formatFileSize(image.file.size)}</p>
        </div>
      `;
      
      grid.appendChild(imageCard);
    });

    this.imagePreview.appendChild(grid);
  }

  removeImage(index) {
    this.selectedImages.splice(index, 1);
    this.renderImagePreview();
    this.updateUploadArea();
    this.showMessage('Imagen eliminada', 'info');
  }

  updateUploadArea() {
    const uploadContent = this.uploadArea.querySelector('.upload-content h3');
    if (this.selectedImages.length > 0) {
      uploadContent.textContent = `${this.selectedImages.length} imagen(es) seleccionada(s)`;
    } else {
      uploadContent.textContent = 'Arrastra las imágenes aquí';
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    this.showLoadingModal();
    
    try {
      const formData = new FormData(this.form);
      const data = {
        lider: formData.get('lider'),
        zona: formData.get('zona'),
        imagenes: this.selectedImages.map(img => ({
          data: img.data,
          type: img.type,
          name: img.name
        }))
      };

      // URL de tu Google Apps Script
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz1Lue9g14IvYA_9GG4m7C58vWSwSi8HG8p2yNUOY-uhtdDBbnPEtoZSVOMqJYVV4Pz3A/exec';
      
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      this.hideLoadingModal();
      this.showSuccessModal();
      
    } catch (error) {
      console.error('Error al enviar imágenes:', error);
      this.hideLoadingModal();
      this.showMessage('Error al enviar las imágenes. Por favor intente nuevamente.', 'error');
    }
  }

  validateForm() {
    const lider = document.getElementById('lider').value.trim();
    const zona = document.getElementById('zona').value.trim();
    
    if (!lider) {
      this.showMessage('Por favor ingrese el nombre del líder', 'error');
      document.getElementById('lider').focus();
      return false;
    }
    
    if (!zona) {
      this.showMessage('Por favor ingrese la zona', 'error');
      document.getElementById('zona').focus();
      return false;
    }
    
    if (this.selectedImages.length === 0) {
      this.showMessage('Por favor seleccione al menos una imagen', 'error');
      return false;
    }
    
    return true;
  }

  showLoadingModal() {
    this.loadingModal.style.display = 'block';
    this.simulateProgress();
  }

  hideLoadingModal() {
    this.loadingModal.style.display = 'none';
  }

  simulateProgress() {
    let progress = 0;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 95) progress = 95;
      
      progressFill.style.width = progress + '%';
      progressText.textContent = Math.round(progress) + '%';
      
      if (progress >= 95) {
        clearInterval(interval);
      }
    }, 200);
  }

  showSuccessModal() {
    this.successModal.style.display = 'block';
  }

  clearAll() {
    this.selectedImages = [];
    this.renderImagePreview();
    this.updateUploadArea();
    this.imageInput.value = '';
    this.showMessage('Todas las imágenes han sido eliminadas', 'info');
  }

  newForm() {
    this.closeModal('successModal');
    this.form.reset();
    this.clearAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  showMessage(mensaje, tipo) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${tipo}`;
    messageDiv.textContent = mensaje;
    
    Object.assign(messageDiv.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      zIndex: '9999',
      maxWidth: '300px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });
    
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db'
    };
    
    messageDiv.style.backgroundColor = colors[tipo] || colors.info;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
      messageDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 300);
    }, 4000);
  }
}

// Inicializar la aplicación
let photoManager;
document.addEventListener('DOMContentLoaded', () => {
  photoManager = new PhotoFormManager();
});
