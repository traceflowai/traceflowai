import { useState } from 'react';
import KeywordManager from '../components/settings/KeywordManager';
import { useThemeStore } from '../store/theme';

const settingsSections = [
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage how you receive alerts and updates.',
    settings: [
      {
        id: 'email-alerts',
        label: 'Email Alerts',
        description: 'Receive notifications via email',
        type: 'toggle',
      },
      {
        id: 'alert-threshold',
        label: 'Risk Score Threshold',
        description: 'Minimum risk score to trigger alerts',
        type: 'number',
        min: 0,
        max: 100,
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Display Preferences',
    description: 'Customize your dashboard experience.',
    settings: [
      {
        id: 'dark-mode',
        label: 'Dark Mode',
        description: 'Use dark theme',
        type: 'toggle',
      },
    ],
  },
  {
    id: 'system',
    title: 'System Configuration',
    description: 'Configure system settings and integrations.',
    settings: [
      {
        id: 'keywords',
        label: 'Keywords',
        description: 'Manage your keyword list',
        type: 'button',
      },
    ],
  },
];

export default function Settings() {
  const [settings, setSettings] = useState({
    'email-alerts': true,
    'alert-threshold': 75,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);

  const handleSettingChange = (id: string, value: any) => {
    if (id === 'dark-mode') {
      toggleDarkMode();
    } else {
      setSettings((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Manage your preferences and system configuration.
        </p>
      </div>

      <div className="space-y-6">
        {settingsSections.map((section) => (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700"
          >
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">{section.title}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              {section.settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor={setting.id}
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {setting.label}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                  </div>
                  {setting.type === 'toggle' ? (
                    <button
                      type="button"
                      className={`${
                        (setting.id === 'dark-mode' ? isDarkMode : settings[setting.id])
                          ? 'bg-primary-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out`}
                      onClick={() =>
                        handleSettingChange(
                          setting.id,
                          setting.id === 'dark-mode'
                            ? !isDarkMode
                            : !settings[setting.id]
                        )
                      }
                    >
                      <span
                        className={`${
                          (setting.id === 'dark-mode' ? isDarkMode : settings[setting.id])
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        } inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ease-in-out`}
                      />
                    </button>
                  ) : setting.type === 'number' ? (
                    <input
                      type="number"
                      id={setting.id}
                      min={setting.min}
                      max={setting.max}
                      value={settings[setting.id]}
                      onChange={(e) =>
                        handleSettingChange(setting.id, parseInt(e.target.value))
                      }
                      className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="text-primary-600 hover:underline"
                    >
                      {setting.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <KeywordManager isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
