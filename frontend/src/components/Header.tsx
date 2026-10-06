import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Bell, Pause, Play, Clock, X, Radio, BellRing } from 'lucide-react';
import { NotificationItem } from '../types';

export const Header: React.FC = () => {
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Fetch Scheduler Status safely
  const { data: schedulerStatus } = useQuery({
    queryKey: ['schedulerStatus'],
    queryFn: apiClient.getSchedulerStatus,
    refetchInterval: 15000,
    retry: false,
  });

  // Fetch Notifications safely
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: apiClient.getNotifications,
    refetchInterval: 10000,
    retry: false,
  });

  // Trigger browser push notification when new high score item arrives
  useEffect(() => {
    if (
      notificationPermission === 'granted' &&
      notifications &&
      notifications.length > 0
    ) {
      const latest = notifications[0];
      const lastNotifiedId = localStorage.getItem('last_notified_id');
      if (lastNotifiedId !== String(latest.id)) {
        localStorage.setItem('last_notified_id', String(latest.id));
        try {
          new Notification(`Opportunity Alert (${latest.score}/100)`, {
            body: latest.message.replace(/[*_]/g, ''),
            icon: '/vite.svg',
          });
        } catch (e) {
          console.log('Browser notification error:', e);
        }
      }
    }
  }, [notifications, notificationPermission]);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('Business Radar Notifications Enabled', {
          body: 'You will receive alerts for high-score business opportunities on your device.',
        });
      }
    }
  };

  const pauseMutation = useMutation({
    mutationFn: apiClient.pauseScheduler,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedulerStatus'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: apiClient.resumeScheduler,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedulerStatus'] }),
  });

  const isPaused = schedulerStatus?.is_paused ?? false;

  return (
    <header className="h-14 border-b border-[#29253b] bg-[#13111e] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181623] border border-[#29253b] text-[#a19dbf]">
          <Clock className="w-3.5 h-3.5 text-purple-300" />
          <span>Next Auto Scan:</span>
          <span className="font-medium text-white">
            {isPaused
              ? 'Paused'
              : schedulerStatus?.next_run_time
              ? new Date(schedulerStatus.next_run_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : `Every ${schedulerStatus?.run_interval_hours || 5}h`}
          </span>
        </div>

        <button
          onClick={() => (isPaused ? resumeMutation.mutate() : pauseMutation.mutate())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181623] border border-[#29253b] text-[#a19dbf] hover:text-white hover:border-[#3b3754] transition-colors"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-purple-300" /> : <Pause className="w-3.5 h-3.5 text-purple-300" />}
          <span>{isPaused ? 'Resume Schedule' : 'Pause Schedule'}</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Browser Notification Permission Button */}
        {notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#29253b] border border-[#3b3754] text-purple-200 text-xs font-medium hover:bg-[#322d48] transition-colors"
          >
            <BellRing className="w-3.5 h-3.5 text-purple-300" />
            <span>Enable Push Notifications</span>
          </button>
        )}

        {/* Collector Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181623] border border-[#29253b] text-[#a19dbf] text-xs">
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          <span>Active</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#181623] border border-[#29253b] text-[#a19dbf] hover:text-white hover:border-[#3b3754] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {notifications && notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#181623] border border-[#29253b] rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-[#29253b]">
                <h3 className="font-semibold text-xs text-white flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-purple-300" /> Notifications & Alerts
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[#7e7b99] hover:text-white p-1 rounded hover:bg-[#29253b]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {!notifications || notifications.length === 0 ? (
                  <p className="text-xs text-[#7e7b99] text-center py-6">No notifications sent yet.</p>
                ) : (
                  notifications.map((n: NotificationItem) => (
                    <div
                      key={n.id}
                      className="p-3 bg-[#13111e] border border-[#29253b] rounded-lg space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-start font-medium">
                        <span className="text-purple-300">{n.entity_name || 'Opportunity Alert'}</span>
                        <span className="bg-[#29253b] text-purple-200 px-1.5 py-0.5 rounded text-[10px]">
                          Score: {n.score}/100
                        </span>
                      </div>
                      <p className="text-[#a19dbf] text-[11px] leading-relaxed whitespace-pre-line">{n.message}</p>
                      <div className="text-[9px] text-[#7e7b99] text-right">
                        {new Date(n.sent_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
