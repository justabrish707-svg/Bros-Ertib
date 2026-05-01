import { useState, FormEvent } from 'react';
import { Utensils, X, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { MenuItem, Language } from '../../types';
import { translations } from '../../translations';
import { db, addDoc, collection, updateDoc, doc, deleteDoc, Timestamp } from '../../firebase';
import { uploadImageAsBase64 } from '../../utils/uploadImage';

interface Props {
  language: Language;
  menuItems: MenuItem[];
}

export default function ProductsTab({ language, menuItems }: Props) {
  const t = translations[language];
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const resolveImage = async (formData: FormData, fallback?: string): Promise<string> => {
    if (imageFile) {
      return await uploadImageAsBase64(imageFile, setUploadProgress);
    }
    return (formData.get('image') as string) || fallback || '';
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const imageUrl = await resolveImage(formData);
      if (!imageUrl) { alert('Please provide an image URL or upload a file.'); return; }

      await addDoc(collection(db, 'products'), {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        image: imageUrl,
        category: (formData.get('category') as string) || 'Other',
        createdAt: Timestamp.now(),
        isAvailable: true,
      });

      (e.target as HTMLFormElement).reset();
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      alert('✅ Product added successfully!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`❌ Failed to save product: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const imageUrl = await resolveImage(formData, editingProduct.image);

      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        image: imageUrl,
        category: (formData.get('category') as string) || 'Other',
      });

      alert('Product updated successfully!');
      setEditingProduct(null);
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product.');
      }
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean | undefined) => {
    if (productId.startsWith('default-')) {
      alert('This is a default offline item. Add it via the form first before editing its status.');
      return;
    }
    try {
      await updateDoc(doc(db, 'products', productId), {
        isAvailable: currentStatus === undefined ? false : !currentStatus,
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update product availability.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add / Edit Form */}
      <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5 lg:col-span-1 h-fit sticky top-28">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gold">
          <Utensils size={20} /> {editingProduct ? t.admin.products.editProduct : t.admin.products.addProduct}
        </h3>

        <form key={editingProduct ? editingProduct.id : 'add'} onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.admin.products.name}</label>
            <input name="name" defaultValue={editingProduct?.name || ''} required
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold outline-none transition-all placeholder-white/20"
              placeholder={t.admin.products.namePlaceholder} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.admin.products.desc}</label>
            <textarea name="description" defaultValue={editingProduct?.description || ''} required rows={2}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold outline-none transition-all placeholder-white/20 resize-none"
              placeholder={t.admin.products.descPlaceholder} />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.admin.products.price}</label>
              <input name="price" defaultValue={editingProduct?.price || ''} type="number" min="0" required
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold outline-none transition-all placeholder-white/20"
                placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.admin.products.category}</label>
              <select name="category" defaultValue={editingProduct?.category || 'Foods'}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold outline-none transition-all">
                <option value="Foods">{t.admin.products.categoryFoods}</option>
                <option value="Soft Drinks">{t.admin.products.categorySoftDrinks}</option>
                <option value="Snacks">{t.admin.products.categorySnacks}</option>
                <option value="Other">{t.admin.products.categoryOther}</option>
              </select>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gold/60 uppercase tracking-[0.2em]">{t.admin.products.image}</label>

            {(imagePreview || editingProduct?.image) && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <img src={imagePreview || editingProduct?.image} alt="Preview" className="w-full h-full object-cover" />
                {imagePreview && (
                  <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-all">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gold transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all group">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm text-white/50 group-hover:text-white/80 transition-colors">
                {imageFile ? imageFile.name : t.admin.products.clickToUpload}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} />
            </label>

            <p className="text-[10px] text-white/30">{t.admin.products.pasteUrl}</p>
            <input name="image" defaultValue={editingProduct?.image || ''}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:bg-white/5 focus:border-gold outline-none transition-all placeholder-white/20"
              placeholder="https://..." />
          </div>

          <div className="flex gap-2 mt-2">
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-gold text-luxury-black py-3 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50">
              {isSubmitting
                ? (editingProduct ? t.admin.products.updating : t.admin.products.adding)
                : (editingProduct ? t.admin.products.updateBtn : t.admin.products.addBtn)}
            </button>
            {editingProduct && (
              <button type="button" onClick={() => setEditingProduct(null)}
                className="px-4 bg-white/5 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10">
                {t.admin.products.cancel}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product list */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold mb-6 text-gold">{t.admin.products.currentMenu}</h3>
        {menuItems.map((item) => (
          <div key={item.id} className={`bg-luxury-gray p-4 rounded-2xl border ${item.isAvailable === false ? 'border-red-500/30 opacity-75' : 'border-white/5'} flex flex-col md:flex-row items-center justify-between gap-4 transition-all`}>
            <div className="flex items-center gap-4 w-full">
              <img src={item.image} alt={item.name} className={`w-16 h-16 rounded-xl object-cover shrink-0 ${item.isAvailable === false ? 'grayscale opacity-50' : ''}`} />
              <div className="flex-1">
                <h4 className="font-bold text-lg text-white line-clamp-1 flex items-center gap-2">
                  {item.name}
                  {item.isAvailable === false && (
                    <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">{t.admin.products.soldOut}</span>
                  )}
                </h4>
                <p className="text-gold font-medium">{item.price} ETB</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                className={`p-3 rounded-xl transition-all ${item.isAvailable === false ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500 hover:text-white'}`}
                title={item.isAvailable === false ? t.admin.products.markAvailable : t.admin.products.markSoldOut}>
                {item.isAvailable === false ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              <button onClick={() => setEditingProduct(item)}
                className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all" title={t.admin.products.edit}>
                <Edit2 size={20} />
              </button>
              <button onClick={() => handleDeleteProduct(item.id)}
                className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title={t.admin.products.delete}>
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
