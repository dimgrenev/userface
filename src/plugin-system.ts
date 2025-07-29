import { logger } from './logger';

export type PluginType = 'renderer' | 'validator' | 'analyzer' | 'monitor' | 'custom';

export interface Plugin {
    id: string;
    name: string;
    version: string;
    type: PluginType;
    description?: string;
    install?: () => void | Promise<void>;
    uninstall?: () => void | Promise<void>;
    enable?: () => void | Promise<void>;
    disable?: () => void | Promise<void>;
    [key: string]: any;
}

export interface PluginContext {
    registry: any;
    logger: typeof logger;
    config: PluginConfig;
}

export interface PluginConfig {
    enabled: boolean;
    priority: number;
    settings: Record<string, any>;
}

export interface PluginStatus {
    id: string;
    installed: boolean;
    enabled: boolean;
    version: string;
    lastError?: string;
}

export class PluginSystem {
    private plugins = new Map<string, Plugin>();
    private configs = new Map<string, PluginConfig>();
    private statuses = new Map<string, PluginStatus>();

    constructor(private registry: any) {}

    async registerPlugin(plugin: Plugin, config?: Partial<PluginConfig>): Promise<void> {
        logger.info(`Plugin "${plugin.name}" registered (id: ${plugin.id}, type: ${plugin.type})`);
        
        this.plugins.set(plugin.id, plugin);
        this.configs.set(plugin.id, {
            enabled: false,
            priority: 0,
            settings: {},
            ...config
        });
        this.statuses.set(plugin.id, {
            id: plugin.id,
            installed: false,
            enabled: false,
            version: plugin.version
        });
    }

    async installPlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

        if (plugin.install) {
            await plugin.install();
        }

        const status = this.statuses.get(pluginId);
        if (status) {
            status.installed = true;
        }

        logger.info(`Plugin "${plugin.name}" installed (id: ${pluginId})`);
    }

    async uninstallPlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

        if (plugin.uninstall) {
            await plugin.uninstall();
        }

        const status = this.statuses.get(pluginId);
        if (status) {
            status.installed = false;
            status.enabled = false;
        }

        logger.info(`Plugin "${plugin.name}" uninstalled (id: ${pluginId})`);
    }

    async enablePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

        if (plugin.enable) {
            await plugin.enable();
        }

        const status = this.statuses.get(pluginId);
        if (status) {
            status.enabled = true;
        }

        const config = this.configs.get(pluginId);
        if (config) {
            config.enabled = true;
        }

        logger.info(`Plugin "${plugin.name}" enabled (id: ${pluginId})`);
    }

    async disablePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

        if (plugin.disable) {
            await plugin.disable();
        }

        const status = this.statuses.get(pluginId);
        if (status) {
            status.enabled = false;
        }

        const config = this.configs.get(pluginId);
        if (config) {
            config.enabled = false;
        }

        logger.info(`Plugin "${plugin.name}" disabled (id: ${pluginId})`);
    }

    getPlugin(pluginId: string): Plugin | undefined {
        return this.plugins.get(pluginId);
    }

    getAllPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    getPluginsByType(type: PluginType): Plugin[] {
        return Array.from(this.plugins.values()).filter(p => p.type === type);
    }

    getActivePlugins(): Plugin[] {
        return Array.from(this.plugins.values()).filter(p => {
            const status = this.statuses.get(p.id);
            return status?.installed;
        });
    }

    getInstalledPlugins(): Plugin[] {
        return Array.from(this.plugins.values()).filter(p => {
            const status = this.statuses.get(p.id);
            return status?.installed;
        });
    }

    getEnabledPlugins(): Plugin[] {
        return Array.from(this.plugins.values()).filter(p => {
            const status = this.statuses.get(p.id);
            return status?.enabled;
        });
    }

    getPluginStatus(pluginId: string): PluginStatus | undefined {
        return this.statuses.get(pluginId);
    }

    getAllStatuses(): PluginStatus[] {
        return Array.from(this.statuses.values());
    }

    updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): void {
        const existingConfig = this.configs.get(pluginId);
        if (existingConfig) {
            Object.assign(existingConfig, config);
        }
    }

    async removePlugin(pluginId: string): Promise<void> {
        await this.uninstallPlugin(pluginId);
        this.plugins.delete(pluginId);
        this.configs.delete(pluginId);
        this.statuses.delete(pluginId);
        logger.info(`Plugin removed (id: ${pluginId})`);
    }

    async clear(): Promise<void> {
        for (const pluginId of this.plugins.keys()) {
            await this.removePlugin(pluginId);
        }
    }
}

export let pluginSystem: PluginSystem;

export function initializePluginSystem(registry: any): PluginSystem {
    pluginSystem = new PluginSystem(registry);
    return pluginSystem;
} 