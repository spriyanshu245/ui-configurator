export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
	id: string;
	role: ChatRole;
	content: string;
	timestamp?: string | Date;
	name?: string;
	isLoading?: boolean;
	error?: string;
}

export interface ChatSuggestion {
	id: string;
	label: string;
	value: string;
}

export interface ChatAttachment {
	id: string;
	name: string;
	type: string;
	url?: string;
	size?: number;
}

export interface ChatPanelProps {
	messages: ChatMessage[];
	inputValue: string;
	onInputChange: (value: string) => void;
	onSend: (message: string, attachments?: ChatAttachment[]) => void;
	onClear?: () => void;
	isLoading?: boolean;
	suggestions?: ChatSuggestion[];
	attachments?: ChatAttachment[];
	placeholder?: string;
	disabled?: boolean;
}

export interface ChatPanelState {
	inputValue: string;
	isLoading: boolean;
	messages: ChatMessage[];
	attachments: ChatAttachment[];
}

export type ChatPanelAction =
	| { type: 'setInput'; value: string }
	| { type: 'setLoading'; value: boolean }
	| { type: 'setMessages'; value: ChatMessage[] }
	| { type: 'addMessage'; value: ChatMessage }
	| { type: 'setAttachments'; value: ChatAttachment[] }
	| { type: 'clear' };
