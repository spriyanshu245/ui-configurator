type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

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
