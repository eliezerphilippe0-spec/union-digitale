import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, Loader, Plane } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, startAfter } from 'firebase/firestore';

const AdminProducts = () => {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productCursor, setProductCursor] = useState(null);
    const [flightCursor, setFlightCursor] = useState(null);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const [hasMoreFlights, setHasMoreFlights] = useState(true);
    const PAGE_SIZE = 20;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        title: '',
        price: '',
        type: 'physical',
        brand: '',
        image: '📦',
        inStock: true,
        // Flight specific
        airline: '',
        origin: 'PAP',
        destination: 'MIA',
        departureTime: '',
        arrivalTime: '',
        class: 'economy'
    });

    // Fetch All Items (Products + Flights)
    const fetchItems = async (reset = false) => {
        setLoading(true);
        try {
            let productsQ = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
            let flightsQ = query(collection(db, 'flights'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

            if (!reset && productCursor) {
                productsQ = query(collection(db, 'products'), orderBy('createdAt', 'desc'), startAfter(productCursor), limit(PAGE_SIZE));
            }
            if (!reset && flightCursor) {
                flightsQ = query(collection(db, 'flights'), orderBy('createdAt', 'desc'), startAfter(flightCursor), limit(PAGE_SIZE));
            }

            const [productsSnap, flightsSnap] = await Promise.all([
                getDocs(productsQ),
                getDocs(flightsQ)
            ]);

            const productsData = productsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                collection: 'products'
            }));

            const flightsData = flightsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                title: `Vol ${doc.data().airline}: ${doc.data().origin}-${doc.data().destination}`,
                type: 'flight',
                image: '✈️',
                brand: doc.data().airline,
                collection: 'flights'
            }));

            const nextProductCursor = productsSnap.docs[productsSnap.docs.length - 1] || null;
            const nextFlightCursor = flightsSnap.docs[flightsSnap.docs.length - 1] || null;
            setProductCursor(nextProductCursor);
            setFlightCursor(nextFlightCursor);
            setHasMoreProducts(productsSnap.docs.length === PAGE_SIZE);
            setHasMoreFlights(flightsSnap.docs.length === PAGE_SIZE);

            const nextItems = [...productsData, ...flightsData];
            setItems(prev => reset ? nextItems : [...prev, ...nextItems]);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems(true);
    }, []);

    // Add Item
    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            if (newItem.type === 'flight') {
                await addDoc(collection(db, 'flights'), {
                    airline: newItem.airline,
                    origin: newItem.origin,
                    destination: newItem.destination,
                    price: Number(newItem.price),
                    departureTime: new Date(newItem.departureTime),
                    arrivalTime: new Date(newItem.arrivalTime),
                    class: newItem.class,
                    seatsAvailable: 100,
                    createdAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'products'), {
                    title: newItem.title,
                    price: Number(newItem.price),
                    type: newItem.type,
                    brand: newItem.brand,
                    image: newItem.image,
                    inStock: newItem.inStock,
                    createdAt: serverTimestamp()
                });
            }
            alert(t('added_success'));
            setIsModalOpen(false);
            setNewItem({
                title: '', price: '', type: 'physical', brand: '', image: '📦', inStock: true,
                airline: '', origin: 'PAP', destination: 'MIA', departureTime: '', arrivalTime: '', class: 'economy'
            });
            fetchItems();
        } catch (error) {
            console.error("Error adding item:", error);
            alert(`Erreur: ${error.message}`); // Keeping generic error prefix or use t('reseed_error') variant? Let's keep distinct error msg
        }
    };

    // Delete Item
    const handleDelete = async (id, collectionName) => {
        if (!window.confirm(t('delete_confirm'))) return;
        try {
            await deleteDoc(doc(db, collectionName, id));
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('global_catalog')}</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" /> {t('add_btn')}
                </button>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader className="animate-spin w-8 h-8 text-secondary mx-auto" />
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="p-4">{t('table_name')}</th>
                                <th className="p-4">{t('table_type')}</th>
                                <th className="p-4">{t('table_price')}</th>
                                <th className="p-4">{t('table_details')}</th>
                                <th className="p-4 text-right">{t('table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-lg">
                                                {item.image}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 line-clamp-1">{item.title}</div>
                                                <div className="text-xs text-gray-500">{item.brand}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                            ${item.type === 'digital' ? 'bg-purple-100 text-purple-700' :
                                                item.type === 'flight' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'}`}>
                                            {item.type === 'digital' ? t('type_digital') : item.type === 'flight' ? t('type_flight') : t('type_physical')}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">
                                        {item.price?.toLocaleString()} G
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">
                                        {item.type === 'flight' ? (
                                            <div>
                                                {new Date(item.departureTime?.seconds * 1000).toLocaleDateString()} <br />
                                                {item.origin} &rarr; {item.destination}
                                            </div>
                                        ) : (
                                            item.inStock ? <span className="text-green-600">{t('in_stock')}</span> : <span className="text-red-600">{t('out_of_stock')}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(item.id, item.collection)}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {(hasMoreProducts || hasMoreFlights) && !loading && (
                <div className="p-4 flex justify-center">
                    <button
                        onClick={() => fetchItems(false)}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        {t('load_more')}
                    </button>
                </div>
            )}

            {/* Add Item Modal */}
            {isModalOpen && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{t('add_item_title')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('type_label')}</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newItem.type}
                                    onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="physical">{t('select_physical')}</option>
                                    <option value="digital">{t('select_digital')}</option>
                                    <option value="flight">{t('select_flight')}</option>
                                </select>
                            </div>

                            {newItem.type === 'flight' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('airline_label')}</label>
                                            <input type="text" required className="w-full border p-2 rounded" value={newItem.airline} onChange={e => setNewItem({ ...newItem, airline: e.target.value })} placeholder="ex: Sunrise" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('class_label')}</label>
                                            <select className="w-full border p-2 rounded" value={newItem.class} onChange={e => setNewItem({ ...newItem, class: e.target.value })}>
                                                <option value="economy">{t('class_economy')}</option>
                                                <option value="business">{t('class_business')}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('origin_label')}</label>
                                            <input type="text" required className="w-full border p-2 rounded" value={newItem.origin} onChange={e => setNewItem({ ...newItem, origin: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('destination_label')}</label>
                                            <input type="text" required className="w-full border p-2 rounded" value={newItem.destination} onChange={e => setNewItem({ ...newItem, destination: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('departure_label')}</label>
                                        <input type="datetime-local" required className="w-full border p-2 rounded" value={newItem.departureTime} onChange={e => setNewItem({ ...newItem, departureTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('arrival_label')}</label>
                                        <input type="datetime-local" required className="w-full border p-2 rounded" value={newItem.arrivalTime} onChange={e => setNewItem({ ...newItem, arrivalTime: e.target.value })} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('title_label')}</label>
                                        <input type="text" required className="w-full border p-2 rounded" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('brand_label')}</label>
                                        <input type="text" className="w-full border p-2 rounded" value={newItem.brand} onChange={e => setNewItem({ ...newItem, brand: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('price_htg_placeholder')}</label>
                                <input type="number" required className="w-full border p-2 rounded" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
                            </div>

                            <button type="submit" className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-2 rounded transition-colors">
                                {t('add_btn')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
