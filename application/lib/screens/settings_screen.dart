
import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: <Widget>[
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Profile'),
            subtitle: const Text('View and edit your profile details'),
            onTap: () {
              // TODO: Navigate to Profile Edit Screen
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile settings - Not implemented yet')),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Change Password'),
            onTap: () {
              // TODO: Navigate to Change Password Screen
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Change password - Not implemented yet')),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.notifications_none),
            title: const Text('Notifications'),
            onTap: () {
              // TODO: Navigate to Notification Settings Screen
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notification settings - Not implemented yet')),
              );
            },
          ),
          SwitchListTile(
            secondary: const Icon(Icons.brightness_6_outlined),
            title: const Text('Dark Mode'),
            value: false, // TODO: Implement dark mode state management
            onChanged: (bool value) {
              // TODO: Implement dark mode toggle
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Dark mode toggle - Not implemented yet. Value: $value')),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('About'),
            onTap: () {
              // TODO: Show About Dialog or Screen
              showAboutDialog(
                context: context,
                applicationName: 'EnglishBhashi Mobile App',
                applicationVersion: '1.0.0',
                applicationLegalese: '© 2024 EnglishBhashi',
                children: <Widget>[
                  const Padding(
                    padding: EdgeInsets.only(top: 15),
                    child: Text('Learning English, made easy.'),
                  )
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
