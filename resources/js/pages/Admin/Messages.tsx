import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Send, User, MessageSquare, RefreshCw, X, Hash } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminMessageService, 
    Message, 
    MessageFormData, 
    ConversationThread,
    MessageStats,
    MinimalUser,
    PaginationData,
} from '../../../services/AdminMessageService'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#3498DB]'; // Blue for Messages
const HOVER_COLOR_CLASS = 'hover:bg-[#2980B9]';
const TEXT_COLOR_CLASS = 'text-[#3498DB]';
const RING_COLOR_CLASS = 'focus:ring-[#3498DB]';
const LIGHT_BG_CLASS = 'bg-[#3498DB]/10';

// ========================================================================
// 📦 INTERFACES & UTILS
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

// Placeholder component for simplicity
const Notification: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' 
        ? PRIMARY_COLOR_CLASS
        : 'bg-gradient-to-r from-red-500 to-red-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button 
                        onClick={onClose}
                        className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Placeholder for current user ID (MUST be fetched from Auth context in a real app)
const CURRENT_USER_ID = 1; 

// ========================================================================
// 📝 COMPOSE MODAL (For starting new messages) - Simplified for quick response
// ========================================================================

const ComposeMessageModal: React.FC<{
    onClose: () => void;
    onSend: (data: MessageFormData) => Promise<void>;
    allUsers: MinimalUser[];
    loadingUsers: boolean;
}> = ({ onClose, onSend, allUsers, loadingUsers }) => {
    const [formData, setFormData] = useState<MessageFormData>({
        receiver_id: 0,
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (formData.receiver_id === 0) {
             setErrors({ receiver_id: ['Please select a recipient.'] });
             setLoading(false);
             return;
        }

        try {
            await onSend(formData);
            onClose(); 
        } catch (error: any) {
            setErrors({ message: [error.message] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <h2 className="text-xl font-bold text-white">Compose New Message</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                            <select
                                name="receiver_id"
                                value={formData.receiver_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, receiver_id: parseInt(e.target.value) }))}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                disabled={loadingUsers || loading}
                            >
                                <option value={0} disabled>
                                    {loadingUsers ? 'Loading users...' : 'Select Recipient'}
                                </option>
                                {allUsers
                                    .filter(user => user.id !== CURRENT_USER_ID) // Prevent messaging self
                                    .map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.role})
                                        </option>
                                    ))}
                            </select>
                            {errors.receiver_id && (<p className="text-red-500 text-xs mt-1">{errors.receiver_id[0]}</p>)}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                rows={4}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                required
                            />
                            {errors.message && (<p className="text-red-500 text-xs mt-1">{errors.message[0]}</p>)}
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading || formData.receiver_id === 0}>
                                {loading ? 'Sending...' : 'Send Message'}
                                <Send className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 🏠 MAIN MESSAGES PAGE
// ========================================================================

const MessagesPage: React.FC = () => {
    const [conversations, setConversations] = useState<ConversationThread[]>([]);
    const [activeThread, setActiveThread] = useState<ConversationThread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [allUsers, setAllUsers] = useState<MinimalUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const [stats, setStats] = useState<MessageStats>({
        total_sent: 0,
        total_received: 0,
        unread_count: 0,
        recent_messages: 0,
        total_messages: 0,
    });

    const loadConversations = useCallback(async () => {
        setLoading(true);
        try {
            // In a real app, you might pass search filters here
            const response = await adminMessageService.getConversations();
            if (response.success && Array.isArray(response.data)) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            setNotification({ type: 'error', message: 'Failed to load conversations.' });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const response = await adminMessageService.getMessageStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading message stats:', error);
        }
    }, []);
    
    const loadThread = useCallback(async (otherUserId: number) => {
        setLoadingThread(true);
        try {
            const response = await adminMessageService.getMessageThread(otherUserId);
            if (response.success && Array.isArray(response.data)) {
                setMessages(response.data.reverse()); // Reverse to display chronologically
                // Mark as read after loading
                await adminMessageService.markThreadAsRead(otherUserId);
                loadConversations(); // Refresh conversation list to update unread count
                loadStats();
            }
        } catch (error) {
            console.error('Error loading message thread:', error);
            setNotification({ type: 'error', message: 'Failed to load message thread.' });
        } finally {
            setLoadingThread(false);
        }
    }, [loadConversations, loadStats]);
    
    const loadUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const response = await adminMessageService.getAllUsersMinimal();
            if (response.success && Array.isArray(response.data)) {
                setAllUsers(response.data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
        loadStats();
        loadUsers();
    }, [loadConversations, loadStats, loadUsers]);
    
    useEffect(() => {
        if (activeThread) {
            loadThread(activeThread.other_user_id);
        }
    }, [activeThread?.other_user_id, loadThread]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleConversationClick = (thread: ConversationThread) => {
        setActiveThread(thread);
    };

    const handleSendMessage = async (e: React.FormEvent | MessageFormData) => {
        e.preventDefault();

        const data: MessageFormData = e.type === 'submit' 
            ? { receiver_id: activeThread?.other_user_id || 0, message: messageInput }
            : (e as MessageFormData);

        if (!data.message.trim() || data.receiver_id === 0) return;

        try {
            const response = await adminMessageService.sendMessage(data);
            if (response.success) {
                setMessageInput('');
                loadThread(data.receiver_id); // Reload the current thread
                setNotification({ type: 'success', message: 'Message sent!' });
            }
        } catch (error: any) {
             setNotification({ type: 'error', message: error.message || 'Failed to send message' });
        }
    };

    const isMessageFromCurrentUser = (message: Message) => message.sender_id === CURRENT_USER_ID;

    return (
        <AppLayout>
            <div className="p-8 h-full flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
                    
                    {/* Header/Stats */}
                    <div className="mb-6 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Message Center</h1>
                        <button
                            onClick={() => setShowComposeModal(true)}
                            className={`flex items-center px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-md`}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Compose
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                         <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                            <p className="text-gray-500 text-sm font-medium">Total Messages</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_messages || 0}</p>
                        </div>
                         <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                            <p className="text-gray-500 text-sm font-medium">Unread</p>
                            <p className="text-2xl font-bold text-red-600">{stats.unread_count || 0}</p>
                        </div>
                         <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                            <p className="text-gray-500 text-sm font-medium">Sent</p>
                            <p className="text-2xl font-bold text-green-600">{stats.total_sent || 0}</p>
                        </div>
                         <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                            <p className="text-gray-500 text-sm font-medium">Received</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.total_received || 0}</p>
                        </div>
                    </div>

                    {/* Main Chat Layout */}
                    <div className="flex-grow flex bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[60vh] overflow-hidden">
                        
                        {/* Conversation List (Left Panel) */}
                        <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b border-gray-200">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center"><MessageSquare className="w-5 h-5 mr-2" /> Conversations</h3>
                            </div>
                            <div className="overflow-y-auto flex-grow">
                                {loading ? (
                                    <div className="p-4 text-center"><RefreshCw className={`h-6 w-6 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} /></div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No conversations yet.</div>
                                ) : (
                                    conversations.map(thread => (
                                        <div
                                            key={thread.other_user_id}
                                            onClick={() => handleConversationClick(thread)}
                                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                                                activeThread?.other_user_id === thread.other_user_id
                                                    ? `${LIGHT_BG_CLASS} border-l-4 border-[#3498DB]`
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className={`font-semibold ${thread.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {thread.other_user.name}
                                                </div>
                                                {thread.unread_count > 0 && (
                                                    <span className="text-xs bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                                        {thread.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm mt-1 truncate ${thread.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                                {thread.last_message_preview}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{thread.last_message_at}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Message Thread (Right Panel) */}
                        <div className="w-full md:w-2/3 flex flex-col bg-gray-50">
                            {activeThread ? (
                                <>
                                    <div className="p-4 border-b border-gray-200 bg-white">
                                        <h3 className="font-bold text-lg text-gray-800">{activeThread.other_user.name} ({activeThread.other_user.role})</h3>
                                    </div>
                                    <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                                        {loadingThread ? (
                                            <div className="p-4 text-center"><RefreshCw className={`h-6 w-6 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} /></div>
                                        ) : messages.length === 0 ? (
                                             <div className="p-4 text-center text-gray-500 text-sm">Start a new conversation!</div>
                                        ) : (
                                            messages.map((message) => (
                                                <div 
                                                    key={message.id} 
                                                    className={`flex ${isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-sm ${
                                                        isMessageFromCurrentUser(message) 
                                                            ? `${PRIMARY_COLOR_CLASS} text-white rounded-br-none` 
                                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                                    }`}>
                                                        <p className="text-xs font-semibold mb-1">
                                                            {isMessageFromCurrentUser(message) ? 'You' : message.sender.name}
                                                        </p>
                                                        <p className="text-sm break-words">{message.message}</p>
                                                        <p className={`text-xs mt-1 opacity-70 ${isMessageFromCurrentUser(message) ? 'text-white' : 'text-gray-500'}`}>
                                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isMessageFromCurrentUser(message) && message.status === 'read' && <span className="ml-1">✓✓</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex space-x-3">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            className={`flex-grow px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                            placeholder="Type a message..."
                                            disabled={loadingThread}
                                        />
                                        <button
                                            type="submit"
                                            className={`p-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all disabled:opacity-50`}
                                            disabled={!messageInput.trim() || loadingThread}
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-grow flex items-center justify-center text-gray-500">
                                    <p className="text-lg">Select a conversation to view messages</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modals */}
                    {showComposeModal && (
                        <ComposeMessageModal
                            onClose={() => setShowComposeModal(false)}
                            onSend={handleSendMessage} // Uses the main send handler
                            allUsers={allUsers}
                            loadingUsers={loadingUsers}
                        />
                    )}

                    {notification && (
                        <Notification
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default MessagesPage;