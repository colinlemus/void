/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState } from 'react';
import { useIsDark, useAccessor } from '../util/services.js';

import '../styles.css'
import { SidebarChat } from './SidebarChat.js';
import ErrorBoundary from './ErrorBoundary.js';
import { MessageSquare, Briefcase } from 'lucide-react';

type TabName = 'chat' | 'orchestration';



// Claude Agent Role Definitions
interface ClaudeRole {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	prompt: string;
	allowedTools: string[];
}

const claudeRoles: Record<string, ClaudeRole> = {
	cto: {
		id: 'cto',
		name: 'CTO Agent',
		description: 'Chief Task Officer - Project decomposition and delegation',
		icon: '👨‍💼',
		color: '#8b5a2b',
		allowedTools: ['Write', 'Edit', 'Read', 'Glob', 'Grep'],
		prompt: `You are a CTO (Chief Task Officer) Claude - the top-level project strategist and task delegator. Your role is to:

1. **Project Decomposition**: Break down complex projects into manageable workstreams
2. **Create Requirements**: Write comprehensive requirement documents with clear specifications
3. **Team Assignment**: Decide which teams (Frontend, Backend, DevOps, Architecture) handle what
4. **Coordinate Dependencies**: Identify integration points and team coordination needs
5. **Set Priorities**: Define critical path and timeline for project delivery
6. **Document Everything**: Create structured files in delegation/ folder for team handoffs

**File Structure You Create:**
- delegation/requirements/PROJECT_OVERVIEW.md (vision, goals, scope)
- delegation/requirements/TEAM_BREAKDOWN.md (who does what)
- delegation/requirements/INTEGRATION_POINTS.md (cross-team coordination)
- delegation/tasks/PRIORITY_ORDER.md (sequence and dependencies)

**Your Communication Style:**
"ayo [TEAM MANAGER], here's your workstream..." 
Always create files that managers can reference and build upon.

What project would you like me to break down and organize?`
	},
	frontendManager: {
		id: 'frontendManager', 
		name: 'Frontend Manager',
		description: 'UI/UX team lead - manages frontend development',
		icon: '🎨',
		color: '#e11d48',
		allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob'],
		prompt: `You are a Frontend Manager Claude - the team lead for all UI/UX development. Your role is to:

1. **Read CTO Requirements**: Study PROJECT_OVERVIEW.md and TEAM_BREAKDOWN.md from CTO
2. **Create Detailed Tasks**: Break down high-level frontend requirements into specific components
3. **Delegate to Builders**: Assign UI components, styling, and client logic to frontend builders
4. **Coordinate QA**: Work with QA testers for UI testing, accessibility, and user experience
5. **Manage Integration**: Coordinate with Backend Manager for API contracts and data flow
6. **Track Progress**: Monitor team progress and escalate blockers

**Files You Create:**
- delegation/tasks/FRONTEND_TASKS.md (detailed component breakdown)
- delegation/tasks/UI_COMPONENT_SPECS.md (styling and behavior specs)
- delegation/handoffs/FRONTEND_TO_BACKEND.md (API requirements)
- delegation/progress/FRONTEND_STATUS.md (current progress)

**Your Team:** Frontend Builders, UI/UX QA Testers
**You Coordinate With:** Backend Manager, Architecture Manager

Ready to manage your frontend team! What's the project scope?`
	},
	backendManager: {
		id: 'backendManager',
		name: 'Backend Manager', 
		description: 'API and server team lead - manages backend builders and system testing',
		icon: '⚙️',
		color: '#059669',
		allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
		prompt: `You are a Backend Manager Claude - the team lead for all server-side development. Your role is to:

1. **Read CTO Requirements**: Study PROJECT_OVERVIEW.md and system requirements from CTO
2. **Design APIs**: Create API specifications and database schemas
3. **Delegate to Builders**: Assign API endpoints, database work, and business logic to backend builders
4. **Coordinate Integration**: Work with Frontend Manager on API contracts and data formats
5. **Manage Testing**: Coordinate with QA for API testing, load testing, and integration testing
6. **Handle DevOps Handoffs**: Prepare deployment requirements and infrastructure needs

**Files You Create:**
- delegation/tasks/BACKEND_TASKS.md (API and database breakdown)
- delegation/tasks/API_SPECIFICATIONS.md (endpoint docs and schemas)  
- delegation/handoffs/BACKEND_TO_FRONTEND.md (API contracts and data formats)
- delegation/handoffs/BACKEND_TO_DEVOPS.md (deployment and infrastructure needs)
- delegation/progress/BACKEND_STATUS.md (development progress)

**Your Team:** Backend Builders, API QA Testers, Database Specialists
**You Coordinate With:** Frontend Manager, DevOps Manager, Architecture Manager

Ready to manage your backend team! What's the server-side scope?`
	},
	frontendBuilder: {
		id: 'frontendBuilder',
		name: 'Frontend Builder',
		description: 'Frontend implementation specialist - React, UI components, styling',
		icon: '🎨',
		color: '#06b6d4',
		allowedTools: ['Write', 'Edit', 'Bash', 'Read', 'Grep'],
		prompt: `You are a Frontend Builder Claude - a specialized frontend implementation expert focused on UI development. Your role is to:

1. **Component Development**: Build React components, Vue components, and UI elements
2. **Styling Implementation**: Create CSS, SCSS, Tailwind, and responsive designs
3. **Interactive Features**: Implement user interactions, animations, and dynamic behavior
4. **State Management**: Handle frontend state with Redux, Context, or other solutions
5. **Performance Optimization**: Optimize bundle size, lazy loading, and rendering performance
6. **Testing**: Write frontend unit tests, integration tests, and visual regression tests

**Your Tools**: Write, Edit, Bash, Read, Grep for frontend development.
**Your Style**: Focus on user experience, clean component architecture, and modern frontend practices.

Ready to build beautiful and functional frontend features! What UI shall we create today?`
	},
	backendBuilder: {
		id: 'backendBuilder',
		name: 'Backend Builder',
		description: 'Backend implementation specialist - APIs, databases, server logic',
		icon: '⚙️',
		color: '#2563eb',
		allowedTools: ['Write', 'Edit', 'Bash', 'Read', 'Grep'],
		prompt: `You are a Backend Builder Claude - a specialized backend implementation expert focused on server-side development. Your role is to:

1. **API Development**: Build REST APIs, GraphQL endpoints, and microservices
2. **Database Implementation**: Design schemas, write queries, and handle data persistence
3. **Server Logic**: Implement business logic, authentication, and authorization
4. **Integration Services**: Connect third-party APIs, payment systems, and external services
5. **Performance Optimization**: Optimize database queries, caching, and server performance
6. **Testing**: Write backend unit tests, integration tests, and API testing

**Your Tools**: Write, Edit, Bash, Read, Grep for backend development.
**Your Style**: Focus on scalable architecture, security best practices, and robust server implementations.

Ready to build powerful backend systems! What server-side feature shall we implement today?`
	},
	reviewer: {
		id: 'reviewer',
		name: 'Reviewer',
		description: 'Code analysis and feedback specialist',
		icon: '🔍',
		color: '#7c3aed',
		allowedTools: ['Read', 'Grep', 'Glob'],
		prompt: `You are a Reviewer Claude - a specialized code analysis and feedback expert. Your role is to:

1. **Code Review**: Analyze code quality, structure, and best practices
2. **Security Analysis**: Identify potential security vulnerabilities and risks
3. **Performance Assessment**: Evaluate code efficiency and suggest optimizations
4. **Documentation Review**: Ensure code is well-documented and maintainable
5. **Standards Compliance**: Verify adherence to coding standards and conventions

**Your Tools**: Read, Grep, Glob for thorough code analysis.
**Your Style**: Provide constructive feedback, identify improvements, and ensure high quality.

Ready to review and improve your codebase! What code would you like me to analyze?`
	},
	tester: {
		id: 'tester',
		name: 'QA Tester',
		description: 'Testing and quality assurance specialist',
		icon: '🧪',
		color: '#dc2626',
		allowedTools: ['Read', 'Write', 'Bash', 'Grep'],
		prompt: `You are a QA Tester Claude - a specialized testing and quality assurance expert. Your role is to:

1. **Test Planning**: Design comprehensive test strategies and test cases
2. **Automated Testing**: Create and maintain automated test suites
3. **Manual Testing**: Perform thorough manual testing for edge cases
4. **Bug Reporting**: Document issues with clear reproduction steps
5. **Quality Assurance**: Ensure software meets quality standards before release

**Your Tools**: Read, Write, Bash, Grep for testing and quality assurance.
**Your Style**: Be thorough, methodical, and focused on finding and preventing issues.

Ready to ensure your software quality! What would you like me to test?`
	}
};

// Team Templates
interface TeamTemplate {
	id: string;
	name: string;
	description: string;
	roles: string[];
	icon: string;
}

const teamTemplates: Record<string, TeamTemplate> = {
	delegation: {
		id: 'delegation',
		name: 'Delegation Team',
		description: 'CTO + Managers for large projects',
		roles: ['cto', 'frontendManager', 'backendManager', 'frontendBuilder', 'backendBuilder', 'reviewer'],
		icon: '🏢'
	},
	development: {
		id: 'development', 
		name: 'Development Team',
		description: 'Frontend & Backend Builders + Reviewer + Tester',
		roles: ['frontendBuilder', 'backendBuilder', 'reviewer', 'tester'],
		icon: '👥'
	},
	fullProject: {
		id: 'fullProject',
		name: 'Full Project Team', 
		description: 'Complete development team',
		roles: ['cto', 'frontendManager', 'backendManager', 'frontendBuilder', 'backendBuilder', 'reviewer', 'tester'],
		icon: '🚀'
	}
};

interface ClaudeInstance {
	id: string;
	name: string;
	role: string;
	roleData: ClaudeRole;
	status: 'active' | 'starting' | 'terminated';
	createdAt: Date;
	terminalId?: string;
	showHistory?: boolean;
	terminalHistory?: string;
	terminalHeight?: number;
}

// Backend Builder component with basic terminal opening
const ProjectOrchestrationPlaceholder = () => {
	const [instances, setInstances] = React.useState<ClaudeInstance[]>([]);
	const [isCreating, setIsCreating] = React.useState(false);
	
	const accessor = useAccessor();
	const terminalService = accessor.get('ITerminalToolService');

	const updateTerminalHistory = React.useCallback(async (instanceId: string, terminalId: string) => {
		try {
			if (terminalService && terminalService.readTerminal) {
				const terminalContent = await terminalService.readTerminal(terminalId);
				// Get entire terminal history
				setInstances(prev => 
					prev.map(inst => 
						inst.id === instanceId 
							? { ...inst, terminalHistory: terminalContent }
							: inst
					)
				);
			}
		} catch (error) {
			console.error('Failed to update terminal history:', error);
		}
	}, [terminalService]);

	const createInstance = React.useCallback(async (roleId: string) => {
		const role = claudeRoles[roleId];
		if (!role) {
			console.error(`Role ${roleId} not found`);
			return;
		}

		setIsCreating(true);
		
		// Create new instance first
		const instance: ClaudeInstance = {
			id: `${roleId}_${Date.now()}`,
			name: `${role.icon} ${role.name}`,
			role: roleId,
			roleData: role,
			status: 'starting',
			createdAt: new Date()
		};
		
		try {
			setInstances(prev => [...prev, instance]);
			
			// Try to create a basic terminal if service is available
			let terminalId: string | undefined;
			if (terminalService && terminalService.createPersistentTerminal) {
				terminalId = await terminalService.createPersistentTerminal({ cwd: null });
			} else {
				console.warn('Terminal service not available, creating instance without terminal');
			}
			
			// Update to active status, store terminal ID, and default history to open
			setInstances(prev => 
				prev.map(inst => 
					inst.id === instance.id 
						? { ...inst, status: 'active', terminalId, showHistory: true, terminalHeight: 300 }
						: inst
				)
			);

			// Auto-send claude command with role prompt (run asynchronously to not block UI)
			if (terminalId && terminalService) {
				// Run this asynchronously so it doesn't affect the UI display
				(async () => {
					try {
						// Send the claude command to start Claude Code
						await terminalService.runCommand('claude', {
							type: 'persistent',
							persistentTerminalId: terminalId
						});

						// Wait for Claude to fully initialize, then send role prompt
						setTimeout(async () => {
							try {
								// Focus the terminal first with longer delay for terminal switching
								await terminalService.focusPersistentTerminal(terminalId);
								console.log(`Focusing terminal for ${role.name}, waiting for terminal to be ready...`);
								
								// Wait longer for terminal focus to complete
								setTimeout(async () => {
									try {
										// Send the role prompt as a message to Claude
										const terminal = terminalService.getPersistentTerminal(terminalId);
										if (terminal) {
											// Send text first without Enter
											await terminal.sendText(role.prompt, false);
											console.log(`Sent role text for ${role.name}, waiting to send Enter...`);
											
											// Longer delay to let text be processed and terminal be ready, then send Enter
											setTimeout(async () => {
												await terminal.sendText('', true); // Send Enter key
												console.log(`✅ Completed role prompt for ${role.name}`);
											}, 3000); // Increased delay to 3000ms to allow time for very long role prompts to be fully typed
										}
									} catch (error) {
										console.error('Failed to send role text:', error);
									}
								}, 2000); // Increased from 1500ms to 2000ms for more reliable terminal focus
							} catch (error) {
								console.error('Failed to focus terminal:', error);
							}
						}, 5000); // Keep the initial 5-second delay

					} catch (error) {
						console.error('Failed to send claude command:', error);
					}
				})();
			}
			
			// Initial history fetch after a short delay to let terminal initialize
			if (terminalId) {
				setTimeout(() => {
					updateTerminalHistory(instance.id, terminalId);
				}, 3000);
			}
			
		} catch (error) {
			console.error('Failed to create terminal:', error);
			// Remove failed instance (instance is now in scope)
			setInstances(prev => prev.filter(inst => inst.id !== instance.id));
		} finally {
			setIsCreating(false);
		}
	}, [terminalService, updateTerminalHistory]);

	const createTeam = React.useCallback(async (templateId: string) => {
		const template = teamTemplates[templateId];
		if (!template) {
			console.error(`Team template ${templateId} not found`);
			return;
		}

		
		// Create instances for each role in the template
		for (const roleId of template.roles) {
			await createInstance(roleId);
			// Small delay between instances to avoid overwhelming the system
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}, [createInstance]);

	const terminateInstance = React.useCallback(async (instanceId: string) => {
		const instance = instances.find(inst => inst.id === instanceId);
		
		// Close the terminal if it exists
		if (instance?.terminalId && terminalService) {
			try {
				// Kill the persistent terminal
				await terminalService.killPersistentTerminal(instance.terminalId);
				console.log(`Terminated terminal for instance: ${instance.name}`);
			} catch (error) {
				console.error('Failed to kill terminal:', error);
			}
		}
		
		setInstances(prev => 
			prev.map(inst => 
				inst.id === instanceId 
					? { ...inst, status: 'terminated' }
					: inst
			)
		);
		
		// Remove from list after short delay
		setTimeout(() => {
			setInstances(prev => prev.filter(inst => inst.id !== instanceId));
		}, 1000);
	}, [instances, terminalService]);

	const focusTerminal = React.useCallback(async (terminalId: string) => {
		try {
			if (terminalService && terminalService.focusPersistentTerminal) {
				await terminalService.focusPersistentTerminal(terminalId);
			} else {
				console.warn('Cannot focus terminal - service method not available');
			}
		} catch (error) {
			console.error('Failed to focus terminal:', error);
		}
	}, [terminalService]);

	const toggleHistory = React.useCallback(async (instanceId: string) => {
		const instance = instances.find(inst => inst.id === instanceId);
		if (!instance || !instance.terminalId) return;

		// If we're hiding history, just toggle
		if (instance.showHistory) {
			setInstances(prev => 
				prev.map(inst => 
					inst.id === instanceId 
						? { ...inst, showHistory: false }
						: inst
				)
			);
			return;
		}

		// If we're showing history, fetch terminal content first
		try {
			setInstances(prev => 
				prev.map(inst => 
					inst.id === instanceId 
						? { ...inst, showHistory: true, terminalHeight: inst.terminalHeight || 300 }
						: inst
				)
			);
			// Use the update function to get last 30 lines
			await updateTerminalHistory(instanceId, instance.terminalId);
		} catch (error) {
			console.error('Failed to read terminal history:', error);
		}
	}, [instances, terminalService, updateTerminalHistory]);

	const resizeTerminal = React.useCallback((instanceId: string, newHeight: number) => {
		const clampedHeight = Math.max(80, Math.min(600, newHeight));
		
		setInstances(prev => 
			prev.map(inst => 
				inst.id === instanceId 
					? { ...inst, terminalHeight: clampedHeight }
					: inst
			)
		);
	}, []);

	// Auto-refresh terminal history every 2 seconds for instances with history shown
	React.useEffect(() => {
		const interval = setInterval(() => {
			instances.forEach(instance => {
				if (instance.status === 'active' && instance.showHistory && instance.terminalId) {
					updateTerminalHistory(instance.id, instance.terminalId);
				}
			});
		}, 2000);

		return () => clearInterval(interval);
	}, [instances, updateTerminalHistory]);

	const activeInstances = instances.filter(inst => inst.status === 'active');

	return (
		<div className="w-full h-full flex flex-col bg-void-bg-2 text-void-fg-1">
			<div className="p-4 border-b border-void-border-1">
				<h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
					<Briefcase size={20} />
					Project Orchestration
				</h2>
				<p className="text-sm text-void-fg-2">
					Manage Claude instances and coordinate team collaboration
				</p>
			</div>
			
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{/* Individual Agent Creation */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-void-fg-2">Create Individual Agent</h3>
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
						{Object.values(claudeRoles).map((role) => (
							<button 
								key={role.id}
								onClick={() => createInstance(role.id)}
								disabled={isCreating}
								className="w-full p-3 rounded-lg border border-void-border-1 hover:bg-void-bg-3 transition-colors flex items-center gap-3 text-left disabled:opacity-50"
								style={{ borderLeft: `3px solid ${role.color}` }}
							>
								<span className="text-2xl">{role.icon}</span>
								<div className="flex-1">
									<h4 className="text-sm font-medium">{role.name}</h4>
									<p className="text-xs text-void-fg-3">{role.description}</p>
								</div>
								{isCreating && <span className="ml-auto text-xs text-void-fg-3">Creating...</span>}
							</button>
						))}
					</div>
				</div>

				{/* Team Templates */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-void-fg-2">Create Team</h3>
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
						{Object.values(teamTemplates).map((template) => (
							<button 
								key={template.id}
								onClick={() => createTeam(template.id)}
								disabled={isCreating}
								className="w-full p-3 rounded-lg border border-void-border-1 hover:bg-void-bg-3 transition-colors flex items-center gap-3 text-left disabled:opacity-50"
							>
								<span className="text-2xl">{template.icon}</span>
								<div className="flex-1">
									<h4 className="text-sm font-medium">{template.name}</h4>
									<p className="text-xs text-void-fg-3">{template.description}</p>
									<div className="flex gap-1 mt-1">
										{template.roles.map(roleId => (
											<span key={roleId} className="text-xs bg-void-bg-3 px-1 py-0.5 rounded">
												{claudeRoles[roleId]?.icon || roleId}
											</span>
										))}
									</div>
								</div>
								{isCreating && <span className="ml-auto text-xs text-void-fg-3">Creating...</span>}
							</button>
						))}
					</div>
				</div>

				{/* Active Instances */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-void-fg-2">Active Instances</h3>
						<span className="text-xs bg-void-bg-3 px-2 py-1 rounded">
							{activeInstances.length} running
						</span>
					</div>
					
					{activeInstances.length === 0 ? (
						<div className="p-4 rounded-lg border border-void-border-1 border-dashed text-center">
							<p className="text-sm text-void-fg-3">No active instances</p>
						</div>
					) : (
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
							{instances.map((instance) => (
								<div key={instance.id} data-instance-id={instance.id} className="rounded-lg border border-void-border-1 overflow-hidden" style={{ borderLeft: `3px solid ${instance.roleData?.color || '#6b7280'}` }}>
									{/* Instance Header */}
									<div className="p-3 flex items-center justify-between">
										<div className="flex items-center gap-3">
											<span className="text-lg">{instance.roleData?.icon || '🤖'}</span>
											<div>
												<h4 className="text-sm font-medium">{instance.name}</h4>
												<p className="text-xs text-void-fg-3">
													{instance.roleData?.description || 'Claude Agent'} • {instance.status}
												</p>
												<p className="text-xs text-void-fg-3">
													Created: {instance.createdAt.toLocaleTimeString()}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<div 
												className="w-2 h-2 rounded-full"
												style={{ backgroundColor: instance.status === 'active' ? '#22c55e' : instance.status === 'starting' ? '#f59e0b' : '#ef4444' }}
											/>
											{instance.status === 'active' && instance.terminalId && (
												<button 
													onClick={() => toggleHistory(instance.id)}
													className="p-1 hover:bg-void-bg-3 rounded text-green-400 hover:text-green-300"
													title="Toggle terminal history"
												>
													📜
												</button>
											)}
											{instance.status === 'active' && instance.terminalId && (
												<button 
													onClick={() => focusTerminal(instance.terminalId!)}
													className="p-1 hover:bg-void-bg-3 rounded text-blue-400 hover:text-blue-300"
													title="Focus terminal"
												>
													👁️
												</button>
											)}
											{instance.status === 'active' && (
												<button 
													onClick={() => terminateInstance(instance.id)}
													className="p-1 hover:bg-void-bg-3 rounded text-red-400 hover:text-red-300"
													title="Terminate instance"
												>
													×
												</button>
											)}
										</div>
									</div>
									
									{/* Terminal History Section */}
									{instance.showHistory && (
										<div className="border-t border-void-border-1 bg-void-bg-1">
											<div className="p-3">
												<div className="flex items-center justify-between mb-2">
													<h5 className="text-xs font-medium text-void-fg-2">Terminal History</h5>
													<span className="text-xs text-void-fg-3">
														Height: {instance.terminalHeight || 300}px (Drag bottom to resize)
													</span>
												</div>
												
												{/* Message Input */}
												<div className="mb-3 flex gap-2">
													<textarea
														placeholder="Send message to terminal..."
														className="flex-1 px-2 py-2 text-xs border border-void-border-1 rounded bg-void-bg-2 text-void-fg-1 placeholder-void-fg-3 focus:outline-none focus:border-blue-500 resize-none min-h-[60px] max-h-[120px]"
														rows={3}
														onKeyDown={async (e) => {
															if (e.key === 'Enter' && !e.shiftKey && instance.terminalId && terminalService) {
																e.preventDefault(); // Prevent default Enter behavior
																const textarea = e.currentTarget;
																const message = textarea.value.trim();
																if (message) {
																	try {
																		await terminalService.focusPersistentTerminal(instance.terminalId);
																		
																		// Get terminal and send message with proper timing
																		const terminal = terminalService.getPersistentTerminal(instance.terminalId);
																		if (terminal) {
																			// Send text first without Enter
																			await terminal.sendText(message, false);
																			
																			// Small delay to let text be processed, then send Enter
																			setTimeout(async () => {
																				await terminal.sendText('', true); // Send Enter key
																			}, 50); // Short delay for text processing
																			
																			textarea.value = '';
																		}
																	} catch (error) {
																		console.error('Failed to send message to terminal:', error);
																	}
																}
															}
														}}
													/>
													<button
														onClick={async () => {
															if (instance.terminalId && terminalService) {
																// Find the textarea that belongs to this specific instance
																const currentInstanceDiv = document.querySelector(`[data-instance-id="${instance.id}"]`);
																const textarea = currentInstanceDiv?.querySelector('textarea[placeholder="Send message to terminal..."]') as HTMLTextAreaElement;
																const message = textarea?.value.trim();
																if (message) {
																	try {
																		await terminalService.focusPersistentTerminal(instance.terminalId);
																		
																		// Get terminal and send message with proper timing
																		const terminal = terminalService.getPersistentTerminal(instance.terminalId);
																		if (terminal) {
																			// Send text first without Enter
																			await terminal.sendText(message, false);
																			
																			// Small delay to let text be processed, then send Enter
																			setTimeout(async () => {
																				await terminal.sendText('', true); // Send Enter key
																			}, 50); // Short delay for text processing
																			
																			textarea.value = '';
																		}
																	} catch (error) {
																		console.error('Failed to send message to terminal:', error);
																	}
																}
															}
														}}
														className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
														title="Send message"
													>
														Send
													</button>
												</div>
												
												<div className="relative border border-gray-600 rounded">
													<div 
														className="bg-black p-2 text-xs font-mono text-green-400 overflow-y-auto overflow-x-hidden flex flex-col"
														style={{ 
															height: `${instance.terminalHeight || 300}px`,
															minHeight: '80px',
															maxHeight: '600px',
															width: '100%'
														}}
													>
														{instance.terminalHistory ? (
															<div className="flex-1 m-0 w-full font-mono text-xs leading-relaxed"
																style={{ 
																	wordBreak: 'break-word',
																	overflowWrap: 'break-word',
																	whiteSpace: 'normal',
																	width: '100%',
																	maxWidth: '100%'
																}}
															>
																{instance.terminalHistory.replace(/\s+/g, ' ').trim()}
															</div>
														) : (
															<span className="text-void-fg-3 flex-1 flex items-center justify-center">Loading terminal history...</span>
														)}
													</div>
													{/* Resize handle bar at bottom */}
													<div 
														className="w-full h-3 bg-gray-700 hover:bg-gray-600 cursor-ns-resize flex items-center justify-center transition-colors border-t border-gray-600"
														onMouseDown={(e) => {
															e.preventDefault();
															const startY = e.clientY;
															const startHeight = instance.terminalHeight || 300;
															
															const handleMouseMove = (moveEvent: MouseEvent) => {
																const deltaY = moveEvent.clientY - startY;
																const newHeight = startHeight + deltaY;
																resizeTerminal(instance.id, newHeight);
															};
															
															const handleMouseUp = () => {
																document.removeEventListener('mousemove', handleMouseMove);
																document.removeEventListener('mouseup', handleMouseUp);
															};
															
															document.addEventListener('mousemove', handleMouseMove);
															document.addEventListener('mouseup', handleMouseUp);
														}}
														title={`Drag to resize terminal height (current: ${instance.terminalHeight || 300}px)`}
													>
														{/* Three horizontal dots to indicate draggable area */}
														<div className="flex gap-1">
															<div className="w-1 h-1 bg-gray-400 rounded-full"></div>
															<div className="w-1 h-1 bg-gray-400 rounded-full"></div>
															<div className="w-1 h-1 bg-gray-400 rounded-full"></div>
														</div>
													</div>
												</div>
												
												{/* Claude Code Confirmation Buttons */}
												<div className="mt-3 space-y-2">
													<h6 className="text-xs font-medium text-void-fg-2">Claude Code Actions</h6>
													<div className="flex gap-2">
														<button 
															onClick={async () => {
																if (instance.terminalId && terminalService && terminalService.focusPersistentTerminal) {
																	try {
																		// Focus the terminal first
																		await terminalService.focusPersistentTerminal(instance.terminalId);
																		
																		// Get terminal and send keystroke with proper timing
																		const terminal = terminalService.getPersistentTerminal(instance.terminalId);
																		if (terminal) {
																			// Send text first without Enter
																			await terminal.sendText('1', false);
																			
																			// Small delay to let text be processed, then send Enter
																			setTimeout(async () => {
																				await terminal.sendText('', true); // Send Enter key
																			}, 50); // Short delay for text processing
																		}
																	} catch (error) {
																		console.error('Failed to focus terminal and send "1" keystroke:', error);
																	}
																}
															}}
															className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
															title="Send '1' (yes) to Claude Code"
														>
															1
														</button>
														
														<button 
															onClick={async () => {
																if (instance.terminalId && terminalService && terminalService.focusPersistentTerminal) {
																	try {
																		// Focus the terminal first
																		await terminalService.focusPersistentTerminal(instance.terminalId);
																		
																		// Get terminal and send keystroke with proper timing
																		const terminal = terminalService.getPersistentTerminal(instance.terminalId);
																		if (terminal) {
																			// Send text first without Enter
																			await terminal.sendText('2', false);
																			
																			// Small delay to let text be processed, then send Enter
																			setTimeout(async () => {
																				await terminal.sendText('', true); // Send Enter key
																			}, 50); // Short delay for text processing
																		}
																	} catch (error) {
																		console.error('Failed to focus terminal and send "2" keystroke:', error);
																	}
																}
															}}
															className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
															title="Send '2' (yes and don't ask) to Claude Code"
														>
															2
														</button>
														
														<button 
															onClick={async () => {
																if (instance.terminalId && terminalService && terminalService.focusPersistentTerminal) {
																	try {
																		// Focus the terminal first
																		await terminalService.focusPersistentTerminal(instance.terminalId);
																		
																		// Get terminal and send keystroke with proper timing
																		const terminal = terminalService.getPersistentTerminal(instance.terminalId);
																		if (terminal) {
																			// Send text first without Enter
																			await terminal.sendText('3', false);
																			
																			// Small delay to let text be processed, then send Enter
																			setTimeout(async () => {
																				await terminal.sendText('', true); // Send Enter key
																			}, 50); // Short delay for text processing
																		}
																	} catch (error) {
																		console.error('Failed to focus terminal and send "3" keystroke:', error);
																	}
																}
															}}
															className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
															title="Send '3' (no) to Claude Code"
														>
															3
														</button>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export const Sidebar = ({ className }: { className: string }) => {
	const [activeTab, setActiveTab] = useState<TabName>('chat');
	const isDark = useIsDark();

	return (
		<div
			className={`@@void-scope ${isDark ? 'dark' : ''}`}
			style={{ width: '100%', height: '100%' }}
		>
			<div
				// default background + text styles for sidebar
				className={`
					w-full h-full
					bg-void-bg-2
					text-void-fg-1
					flex flex-col
				`}
			>
				{/* Tab Navigation */}
				<div className="flex border-b border-void-border-1">
					<button
						onClick={() => setActiveTab('chat')}
						className={`
							flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2
							transition-colors
							${activeTab === 'chat' 
								? 'bg-void-bg-3 text-void-fg-1 border-b-2 border-blue-500' 
								: 'text-void-fg-2 hover:text-void-fg-1 hover:bg-void-bg-3'
							}
						`}
					>
						<MessageSquare size={16} />
						Chat
					</button>
					<button
						onClick={() => setActiveTab('orchestration')}
						className={`
							flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2
							transition-colors
							${activeTab === 'orchestration' 
								? 'bg-void-bg-3 text-void-fg-1 border-b-2 border-blue-500' 
								: 'text-void-fg-2 hover:text-void-fg-1 hover:bg-void-bg-3'
							}
						`}
					>
						<Briefcase size={16} />
						Project
					</button>
				</div>

				{/* Tab Content */}
				<div className="flex-1 overflow-hidden">
					<ErrorBoundary>
						{activeTab === 'chat' ? (
							<SidebarChat />
						) : (
							<ProjectOrchestrationPlaceholder />
						)}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
};

