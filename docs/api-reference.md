[Back: Advanced Usage](advanced-usage.md)

# API Reference

This section is for developers who want to integrate UI Configurator configurations into their applications.

## How to Use Configurations

- UI Configurator saves your UI as a configuration file (JSON).
- Import this file into your application to render the UI as designed.
- You don’t need to edit the JSON manually—just use the UI Configurator for changes.

## File Structure

- `/src/app/components/PropertyPanels/`: Panel components for editing properties
- `/src/app/data/`: Data definitions and property maps
- `/src/app/context/`: State management providers
- `/src/app/services/`: API and business logic
- `/src/app/utils/`: Utility functions
- `/src/app/types/`: Type definitions

## Extending the System

- Add new panels for custom editing needs
- Add new properties for advanced logic
- Use the UI Configurator to update and export new configurations

## Example Integration

1. Design your UI in the UI Configurator and export the configuration.
2. Import the configuration JSON into your app.
3. Use your app’s rendering engine to display the UI as designed.
4. For updates, re-edit in the UI Configurator and re-import.

---

For more details, see the source files and TypeScript definitions in your codebase.

[Back: Advanced Usage](advanced-usage.md)
