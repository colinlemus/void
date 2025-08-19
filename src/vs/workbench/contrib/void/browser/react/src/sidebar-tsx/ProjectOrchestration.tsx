/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useCallback } from 'react';
import { Users, Briefcase, Plus, Settings, Play, Square, Trash2, Terminal, User, Crown, Code, TestTube, Cog } from 'lucide-react';
import { useAccessor } from '../util/services.js';
import { ITerminalToolService } from '../../../../terminalToolService.js';

// Claude Role definitions (simplified from vscode-extension-project)
interface ClaudeRole {
	id: string;
	name: string;
	description: string;
	color: string;
	icon: string;
	allowedTools: string[];
}

interface ClaudeInstance {
	id: string;
	name: string;
	role: string;
	status: 'active' | 'starting' | 'terminated';
	createdAt: Date;
}

const claudeRoles: Record<string, ClaudeRole> = {
	cto: {
		id: 'cto',
		name: 'CTO Agent',
		description: 'Chief Task Officer - Project decomposition and delegation',
		color: '#8b5a2b',
		icon: '👨‍💼',
		allowedTools: ['Write', 'Edit', 'Read', 'Glob', 'Grep']
	},
	frontendManager: {
		id: 'frontendManager',
		name: 'Frontend Manager',
		description: 'UI/UX team lead - manages frontend development',
		color: '#e11d48',
		icon: '🎨',
		allowedTools: ['Read', 'Write', 'Edit', 'Grep', 'Glob']
	},
	backendManager: {
		id: 'backendManager',
		name: 'Backend Manager',
		description: 'API and server team lead - manages backend development',
		color: '#059669',
		icon: '⚙️',
		allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob']
	},
	builder: {
		id: 'builder',
		name: 'Builder',
		description: 'Implementation specialist - writes and edits code',
		color: '#2563eb',
		icon: '🔨',
		allowedTools: ['Write', 'Edit', 'Bash', 'Read', 'Grep']
	},
	reviewer: {
		id: 'reviewer',
		name: 'Reviewer',
		description: 'Code analysis and feedback specialist',
		color: '#7c3aed',
		icon: '🔍',
		allowedTools: ['Read', 'Grep', 'Glob']
	},
	tester: {
		id: 'tester',
		name: 'QA Tester',
		description: 'Testing and quality assurance specialist',
		color: '#dc2626',
		icon: '🧪',
		allowedTools: ['Read', 'Write', 'Bash', 'Grep']
	}
};

const teamTemplates = {
	delegation: {
		name: 'Delegation Team',
		description: 'CTO + 4 managers for large projects',
		roles: ['cto', 'frontendManager', 'backendManager', 'builder', 'reviewer']
	},
	development: {
		name: 'Development Team',
		description: 'Builder + Reviewer + Tester',
		roles: ['builder', 'reviewer', 'tester']
	},
	fullProject: {
		name: 'Full Project Team',
		description: 'Complete development team',
		roles: ['cto', 'frontendManager', 'backendManager', 'builder', 'reviewer', 'tester']
	}
};

export const ProjectOrchestration = () => {
	const [instances, setInstances] = useState<ClaudeInstance[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [showRoleSelector, setShowRoleSelector] = useState(false);
	const [showTeamSelector, setShowTeamSelector] = useState(false);
	
	const accessor = useAccessor();
	const terminalService = accessor.get(ITerminalToolService);

	const createInstance = useCallback(async (roleId: string) => {
		setIsCreating(true);
		const role = claudeRoles[roleId];
		
		try {
			// Create new instance
			const instance: ClaudeInstance = {
				id: `claude_${roleId}_${Date.now()}`,
				name: `${role.icon} ${role.name}`,
				role: roleId,
				status: 'starting',
				createdAt: new Date()
			};
			
			setInstances(prev => [...prev, instance]);
			
			// Create terminal with Claude Code
			const terminalName = `Claude ${role.name}`;
			await terminalService.createTerminal({
				name: terminalName,
				command: 'claude',
				workingDirectory: undefined,
				env: {
					CLAUDE_ROLE: roleId,
					CLAUDE_INSTANCE_ID: instance.id
				}
			});
			
			// Update instance status
			setInstances(prev => 
				prev.map(inst => 
					inst.id === instance.id 
						? { ...inst, status: 'active' }
						: inst
				)
			);
			
		} catch (error) {
			console.error('Failed to create Claude instance:', error);
			// Remove failed instance
			setInstances(prev => prev.filter(inst => inst.id !== instance.id));
		} finally {
			setIsCreating(false);
			setShowRoleSelector(false);
		}
	}, [terminalService]);

	const createTeam = useCallback(async (templateKey: string) => {
		setIsCreating(true);
		const template = teamTemplates[templateKey];
		
		try {
			for (const roleId of template.roles) {
				await createInstance(roleId);
				// Small delay between instances
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		} catch (error) {
			console.error('Failed to create team:', error);
		} finally {
			setIsCreating(false);
			setShowTeamSelector(false);
		}
	}, [createInstance]);

	const terminateInstance = useCallback((instanceId: string) => {
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
	}, []);

	const terminateAll = useCallback(() => {
		instances.forEach(instance => {
			if (instance.status === 'active') {
				terminateInstance(instance.id);
			}
		});
	}, [instances, terminateInstance]);

	const activeInstances = instances.filter(inst => inst.status === 'active');

	return (
		<div className="w-full h-full flex flex-col bg-void-bg-2 text-void-fg-1">
			{/* Header */}
			<div className="p-4 border-b border-void-border-1 flex-shrink-0">
				<h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
					<Briefcase size={20} />
					Project Orchestration
				</h2>
				<p className="text-sm text-void-fg-2">
					Manage Claude instances and coordinate team collaboration
				</p>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 space-y-6">
					{/* Quick Actions */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-void-fg-2">Quick Actions</h3>
						<div className="grid grid-cols-2 gap-2">
							<button 
								onClick={() => setShowTeamSelector(true)}
								disabled={isCreating}
								className="p-3 rounded-lg border border-void-border-1 hover:bg-void-bg-3 transition-colors flex flex-col items-center gap-2 text-sm disabled:opacity-50"
							>
								<Users size={16} />
								Create Team
							</button>
							<button 
								onClick={() => setShowRoleSelector(true)}
								disabled={isCreating}
								className="p-3 rounded-lg border border-void-border-1 hover:bg-void-bg-3 transition-colors flex flex-col items-center gap-2 text-sm disabled:opacity-50"
							>
								<Plus size={16} />
								New Instance
							</button>
						</div>
					</div>

					{/* Active Instances */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium text-void-fg-2">Active Instances</h3>
							<div className="flex items-center gap-2">
								<span className="text-xs bg-void-bg-3 px-2 py-1 rounded">
									{activeInstances.length} running
								</span>
								{activeInstances.length > 0 && (
									<button 
										onClick={terminateAll}
										className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-void-bg-3"
									>
										<Trash2 size={12} />
									</button>
								)}
							</div>
						</div>
						
						{activeInstances.length === 0 ? (
							<div className="p-6 rounded-lg border border-void-border-1 border-dashed text-center">
								<div className="text-void-fg-3 mb-2">
									<Terminal size={24} className="mx-auto" />
								</div>
								<p className="text-sm text-void-fg-3 mb-3">No active instances</p>
								<button 
									onClick={() => setShowRoleSelector(true)}
									className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
								>
									Start Your First Instance
								</button>
							</div>
						) : (
							<div className="space-y-2">
								{instances.map((instance) => {
									const role = claudeRoles[instance.role];
									return (
										<div key={instance.id} className="p-3 rounded-lg border border-void-border-1 flex items-center justify-between">
											<div className="flex items-center gap-3">
												<span className="text-lg">{role.icon}</span>
												<div>
													<h4 className="text-sm font-medium">{instance.name}</h4>
													<p className="text-xs text-void-fg-3">
														{role.description} • {instance.status}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<div 
													className="w-2 h-2 rounded-full"
													style={{ backgroundColor: instance.status === 'active' ? '#22c55e' : '#ef4444' }}
												/>
												{instance.status === 'active' && (
													<button 
														onClick={() => terminateInstance(instance.id)}
														className="p-1 hover:bg-void-bg-3 rounded text-red-400 hover:text-red-300"
													>
														<Square size={12} />
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Team Templates */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-void-fg-2">Team Templates</h3>
						<div className="space-y-2">
							{Object.entries(teamTemplates).map(([key, template]) => (
								<div key={key} className="p-3 rounded-lg border border-void-border-1 hover:bg-void-bg-3 transition-colors cursor-pointer">
									<div className="flex items-center justify-between">
										<div>
											<h4 className="text-sm font-medium">{template.name}</h4>
											<p className="text-xs text-void-fg-3">{template.description}</p>
										</div>
										<button 
											onClick={() => createTeam(key)}
											disabled={isCreating}
											className="p-1 hover:bg-void-bg-4 rounded disabled:opacity-50"
										>
											<Play size={14} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Recent Activity */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-void-fg-2">Recent Activity</h3>
						<div className="p-4 rounded-lg border border-void-border-1">
							{instances.length === 0 ? (
								<p className="text-sm text-void-fg-3 text-center">No recent activity</p>
							) : (
								<div className="space-y-2 text-xs text-void-fg-3">
									{instances.slice(-3).reverse().map(instance => (
										<div key={instance.id}>
											{claudeRoles[instance.role].icon} {instance.name} - {instance.status} at {instance.createdAt.toLocaleTimeString()}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Role Selector Modal */}
			{showRoleSelector && (
				<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-void-bg-2 rounded-lg p-4 max-w-md w-full border border-void-border-1">
						<h3 className="text-lg font-semibold mb-4">Select Claude Role</h3>
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{Object.values(claudeRoles).map((role) => (
								<button
									key={role.id}
									onClick={() => createInstance(role.id)}
									disabled={isCreating}
									className="w-full p-3 text-left rounded-lg border border-void-border-1 hover:bg-void-bg-3 transition-colors disabled:opacity-50"
								>
									<div className="flex items-center gap-3">
										<span className="text-lg">{role.icon}</span>
										<div>
											<h4 className="text-sm font-medium">{role.name}</h4>
											<p className="text-xs text-void-fg-3">{role.description}</p>
										</div>
									</div>
								</button>
							))}
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={() => setShowRoleSelector(false)}
								className="flex-1 px-4 py-2 border border-void-border-1 rounded-lg hover:bg-void-bg-3 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Team Selector Modal */}
			{showTeamSelector && (
				<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-void-bg-2 rounded-lg p-4 max-w-md w-full border border-void-border-1">
						<h3 className="text-lg font-semibold mb-4">Select Team Template</h3>
						<div className="space-y-2">
							{Object.entries(teamTemplates).map(([key, template]) => (
								<button
									key={key}
									onClick={() => createTeam(key)}
									disabled={isCreating}
									className="w-full p-3 text-left rounded-lg border border-void-border-1 hover:bg-void-bg-3 transition-colors disabled:opacity-50"
								>
									<div>
										<h4 className="text-sm font-medium">{template.name}</h4>
										<p className="text-xs text-void-fg-3 mb-2">{template.description}</p>
										<div className="flex gap-1">
											{template.roles.map(roleId => (
												<span key={roleId} className="text-xs">
													{claudeRoles[roleId].icon}
												</span>
											))}
										</div>
									</div>
								</button>
							))}
						</div>
						<div className="flex gap-2 mt-4">
							<button 
								onClick={() => setShowTeamSelector(false)}
								className="flex-1 px-4 py-2 border border-void-border-1 rounded-lg hover:bg-void-bg-3 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};