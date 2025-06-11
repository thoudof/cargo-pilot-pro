
import { supabaseService } from './supabaseService';

export interface ActivityLogData {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}

class ActivityLogger {
  private async getUserInfo() {
    try {
      const user = await supabaseService.getCurrentUser();
      return {
        userId: user?.id,
        userAgent: navigator.userAgent,
        // IP адрес будет определяться на стороне сервера
      };
    } catch (error) {
      console.error('Failed to get user info for logging:', error);
      return { userId: null, userAgent: navigator.userAgent };
    }
  }

  async log(data: ActivityLogData) {
    try {
      const userInfo = await this.getUserInfo();
      
      if (!userInfo.userId) {
        console.warn('Cannot log activity: user not authenticated');
        return;
      }

      await supabaseService.supabase
        .from('activity_logs')
        .insert({
          user_id: userInfo.userId,
          action: data.action,
          entity_type: data.entityType,
          entity_id: data.entityId,
          details: data.details,
          user_agent: userInfo.userAgent
        });

      console.log('Activity logged:', data.action);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Предопределенные методы для частых действий
  async logNavigation(page: string) {
    await this.log({
      action: 'navigation',
      entityType: 'page',
      details: { page }
    });
  }

  async logCreate(entityType: string, entityId: string, details?: Record<string, any>) {
    await this.log({
      action: 'create',
      entityType,
      entityId,
      details
    });
  }

  async logUpdate(entityType: string, entityId: string, details?: Record<string, any>) {
    await this.log({
      action: 'update',
      entityType,
      entityId,
      details
    });
  }

  async logDelete(entityType: string, entityId: string, details?: Record<string, any>) {
    await this.log({
      action: 'delete',
      entityType,
      entityId,
      details
    });
  }

  async logLogin() {
    await this.log({
      action: 'login',
      entityType: 'auth'
    });
  }

  async logLogout() {
    await this.log({
      action: 'logout',
      entityType: 'auth'
    });
  }
}

export const activityLogger = new ActivityLogger();
