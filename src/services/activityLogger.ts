
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
      
      // Получаем информацию о пользователе из профиля
      let userProfile = null;
      if (user?.id) {
        const { data: profile } = await supabaseService.supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        userProfile = profile;
      }

      return {
        userId: user?.id,
        userEmail: user?.email,
        userName: userProfile?.full_name || userProfile?.username || user?.email || 'Неизвестный пользователь',
        userAgent: navigator.userAgent,
        // IP адрес будет определяться на стороне сервера
      };
    } catch (error) {
      console.error('ActivityLogger: Failed to get user info:', error);
      return { 
        userId: null, 
        userEmail: null,
        userName: 'Неизвестный пользователь',
        userAgent: navigator.userAgent 
      };
    }
  }

  async log(data: ActivityLogData) {
    try {
      const userInfo = await this.getUserInfo();
      
      if (!userInfo.userId) {
        console.warn('ActivityLogger: Cannot log activity - user not authenticated');
        return;
      }

      console.log('ActivityLogger: Logging activity:', data.action, data.entityType || 'system', 'by:', userInfo.userName);

      await supabaseService.supabase
        .from('activity_logs')
        .insert({
          user_id: userInfo.userId,
          action: data.action,
          entity_type: data.entityType,
          entity_id: data.entityId,
          details: {
            ...data.details,
            user_email: userInfo.userEmail,
            user_name: userInfo.userName
          },
          user_agent: userInfo.userAgent
        });

      console.log('ActivityLogger: Activity logged successfully:', data.action, 'by:', userInfo.userName);
    } catch (error) {
      console.error('ActivityLogger: Failed to log activity:', error);
    }
  }

  // Предопределенные методы для частых действий
  async logNavigation(page: string, additionalDetails?: Record<string, any>) {
    await this.log({
      action: 'navigation',
      entityType: 'page',
      details: { 
        page,
        timestamp: new Date().toISOString(),
        ...additionalDetails
      }
    });
  }

  async logCreate(entityType: string, entityId: string, details?: Record<string, any>) {
    await this.log({
      action: 'create',
      entityType,
      entityId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logUpdate(entityType: string, entityId: string, details?: Record<string, any>) {
    await this.log({
      action: 'update',
      entityType,
      entityId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logDelete(entityType: string, entityId: string, details?: Record<string, any>) {
    await this.log({
      action: 'delete',
      entityType,
      entityId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logView(entityType: string, entityId?: string, details?: Record<string, any>) {
    await this.log({
      action: 'view',
      entityType,
      entityId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logSearch(entityType: string, searchQuery: string, resultsCount?: number) {
    await this.log({
      action: 'search',
      entityType,
      details: {
        query: searchQuery,
        resultsCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logFilter(entityType: string, filterCriteria: Record<string, any>) {
    await this.log({
      action: 'filter',
      entityType,
      details: {
        criteria: filterCriteria,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logExport(entityType: string, format: string, recordsCount?: number) {
    await this.log({
      action: 'export',
      entityType,
      details: {
        format,
        recordsCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logImport(entityType: string, format: string, recordsCount?: number) {
    await this.log({
      action: 'import',
      entityType,
      details: {
        format,
        recordsCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logLogin(method: string = 'password') {
    await this.log({
      action: 'login',
      entityType: 'auth',
      details: {
        method,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logLogout() {
    await this.log({
      action: 'logout',
      entityType: 'auth',
      details: {
        timestamp: new Date().toISOString()
      }
    });
  }

  async logError(error: string, context?: Record<string, any>) {
    await this.log({
      action: 'error',
      entityType: 'system',
      details: {
        error,
        context,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export const activityLogger = new ActivityLogger();
