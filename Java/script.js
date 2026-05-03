class PhotoFormManager {
  constructor() {
    this.form = document.getElementById('photoForm');
    this.imageInput = document.getElementById('imageInput');
    this.uploadArea = document.getElementById('uploadArea');
    this.imagePreview = document.getElementById('imagePreview');
    this.successModal = document.getElementById('successModal');
    this.loadingModal = document.getElementById('loadingModal');
    
    // AQUÍ ESTÁ TU URL EXACTA
    this.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyyga7Ipyxst79VKSsO2M46CXuZNqI-5vzgx9U06XHSIDdMgkNIXGV95UzHI5VPhq8K/exec'; 
    
    this.selectedImages = [];
    this.maxImages = 20;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    this.uploadArea.addEventListener('click', () => this.imageInput.click());
    
    document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
    document.getElementById('newForm').addEventListener('click', () => location.reload());
  }

  handleDragOver(e) { e.preventDefault(); this.uploadArea.classList.add('drag-over'); }
  handleDragLeave(e) { e.preventDefault(); this.uploadArea.classList.remove('drag-over'); }
  handleDrop(e) {
    e.preventDefault();
    this.uploadArea.classList.remove('drag-over');
    this.processFiles(Array.from(e.dataTransfer.files));
  }
  handleFileSelect(e) { this.processFiles(Array.from(e.target.files)); }

  processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) { alert('Por favor selecciona solo archivos de imagen'); return; }
    if (this.selectedImages.length + imageFiles.length > this.maxImages) { alert(`Máximo ${this.maxImages} imágenes permitidas`); return; }

    imageFiles.forEach(file => {
      if (file.size > this.maxFileSize) { alert(`La imagen ${file.name} es muy grande (máximo 5MB)`); return; }
      this.addImage(file);
    });
  }

  addImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImages.push({
        file: file,
        data: e.target.result,
        type: file.type,
        name: file.name
      });
      this.renderImagePreview();
      this.updateUploadArea();
    };
    reader.readAsDataURL(file);
  }

  renderImagePreview() {
    this.imagePreview.innerHTML = '';
    if (this.selectedImages.length === 0) return;

    const header = document.createElement('h3');
    header.textContent = `Imágenes seleccionadas (${this.selectedImages.length})`;
    this.imagePreview.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'image-grid';

    this.selectedImages.forEach((image, index) => {
      grid.innerHTML += `
        <div class="image-card">
          <div class="image-wrapper">
            <img src="${image.data}" alt="${image.name}">
            <button type="button" class="remove-btn" onclick="photoManager.removeImage(${index})">×</button>
          </div>
          <div class="image-info">
            <p class="image-name">${image.name}</p>
            <p class="image-size">${(image.file.size / (1024*1024)).toFixed(2)} MB</p>
          </div>
        </div>`;
    });
    this.imagePreview.appendChild(grid);
  }

  removeImage(index) {
    this.selectedImages.splice(index, 1);
    this.renderImagePreview();
    this.updateUploadArea();
  }

  updateUploadArea() {
    const content = this.uploadArea.querySelector('.upload-content h3');
    content.textContent = this.selectedImages.length > 0 ? `${this.selectedImages.length} imagen(es) seleccionada(s)` : 'Arrastra las imágenes aquí';
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!document.getElementById('lider').value || !document.getElementById('zona').value || this.selectedImages.length === 0) {
      alert('Por favor complete líder, zona y suba al menos una imagen.');
      return;
    }

    this.loadingModal.style.display = 'block';
    let progress = 0;
    const progressFill = document.getElementById('progressFill');
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      progressFill.style.width = progress + '%';
    }, 500);
    
    try {
      const data = {
        lider: document.getElementById('lider').value,
        zona: document.getElementById('zona').value,
        imagenes: this.selectedImages.map(img => ({ data: img.data, type: img.type, name: img.name }))
      };

      await fetch(this.SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' }, // text/plain evita bloqueos CORS en archivos pesados
        body: JSON.stringify(data)
      });

      clearInterval(interval);
      progressFill.style.width = '100%';
      setTimeout(() => {
        this.loadingModal.style.display = 'none';
        this.successModal.style.display = 'block';
      }, 500);
      
    } catch (error) {
      clearInterval(interval);
      this.loadingModal.style.display = 'none';
      alert('Error al enviar las imágenes. Intente de nuevo.');
    }
  }

  clearAll() {
    this.selectedImages = [];
    this.renderImagePreview();
    this.updateUploadArea();
    this.imageInput.value = '';
  }
}

let photoManager;
document.addEventListener('DOMContentLoaded', () => { photoManager = new PhotoFormManager(); });
