# DayRamp - Timer Features Documentation

## Overview

DayRamp provides specialized productivity tools designed to enhance focus, wellness, and task management. Each feature offers a unique set of capabilities tailored to specific use cases while sharing common functionality for an optimal user experience.

### Common Capabilities
- **Custom Sound Effects**: Configurable audio cues for different phases and transitions
- **Background Music (BGM)**: Separate BGM settings for work and rest phases with volume control
- **Fullscreen Mode**: Distraction-free timer experience
- **Wake Lock Support**: Prevents device from sleeping during active sessions
- **Browser Notifications**: Desktop notifications for phase transitions
- **Keyboard Controls**: Space/Enter to toggle start/pause, Escape to exit fullscreen
- **Session Tracking**: Automatic tracking of session duration and statistics
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Local Storage**: Settings and progress persist across sessions

---

## 1. Pomodoro Timer (Focus Timer)

### Purpose
The Pomodoro Timer implements the famous Pomodoro Technique, a time management method that breaks work into focused intervals separated by short breaks. This technique helps maintain concentration, prevent burnout, and improve productivity.

### Key Features

#### Work/Break Cycles
- **Work Sessions**: Default 25-minute focused work periods
- **Short Breaks**: 5-minute rest periods between work sessions
- **Long Breaks**: 15-minute extended breaks after a set number of work sessions
- **Automatic Cycling**: Seamlessly transitions between work and break phases

#### Customization Options
- **Duration Settings**:
  - Work duration: 1-60 minutes
  - Short break: 1-30 minutes
  - Long break: 1-60 minutes
- **Long Break Frequency**: Configure after how many work sessions (e.g., every 3-4 sessions)
- **Preset Options**: Quick selection between common time configurations
- **Custom Mode**: Full control over all timing parameters

#### Productivity Features
- **Mini Todo List**: Built-in text area for tracking 1-3 priority tasks
- **Session Counter**: Tracks completed work sessions (pomodoros)
- **Daily Statistics**: Monitors total time spent in work and break modes
- **Phase Switching**: Manual override to switch between work/break phases

#### Audio Customization
- **Phase-Specific Sounds**:
  - Pomodoro start sound
  - Break start sound
  - Long break start sound
- **Background Music**:
  - Separate BGM for work phase
  - Different BGM for break phases
  - Automatic switching between BGM tracks

### Use Cases
- Deep work sessions requiring sustained focus
- Study sessions with scheduled breaks
- Task batching and time boxing
- Managing attention-intensive projects
- Preventing mental fatigue during long work days

---

## 2. Breathing Timer

### Purpose
The Breathing Timer provides guided breathing exercises to reduce stress, improve focus, and enhance overall well-being. It supports scientifically-backed breathing patterns with visual and audio guidance.

### Breathing Patterns

#### Box Breathing (4-4-4-4)
- **Pattern**: 4 seconds inhale, 4 seconds hold, 4 seconds exhale, 4 seconds hold
- **Benefits**: Stress reduction, improved concentration, emotional regulation
- **Used By**: Navy SEALs, athletes, meditation practitioners

#### 4-7-8 Breathing
- **Pattern**: 4 seconds inhale, 7 seconds hold, 8 seconds exhale, no final hold
- **Benefits**: Natural tranquilizer for the nervous system, better sleep, anxiety relief
- **Origin**: Based on ancient yogic breathing technique (Pranayama)

### Visual Guidance
- **Progress Rings**:
  - Main ring shows current phase progress
  - Secondary ring displays overall session progress
- **Phase Labels**: Clear "Inhale", "Hold", or "Exhale" indicators
- **Countdown Display**: Shows remaining seconds for current phase
- **Color Indicators**: Visual differentiation between breathing phases

### Customization
- **Session Duration**: 1-30 minutes total breathing time
- **Pattern Selection**: Quick toggle between Box and 4-7-8 patterns
- **Sound Settings**:
  - Start sound when beginning session
  - Transition sound between phases
  - Optional mute mode
- **Background Music**: Calming BGM during breathing sessions

### Health Benefits
- Activates parasympathetic nervous system
- Lowers blood pressure and heart rate
- Improves oxygen exchange
- Enhances mindfulness and present-moment awareness
- Reduces anxiety and stress hormones
- Improves sleep quality when practiced before bed

---

## 3. Interval Timer (HIIT/Tabata/EMOM)

### Purpose
The Interval Timer is designed for high-intensity interval training (HIIT), supporting various workout protocols with precise timing and clear phase indicators. Perfect for fitness enthusiasts, athletes, and trainers.

### Workout Presets

#### Tabata Protocol
- **Structure**: 20 seconds work, 10 seconds rest
- **Rounds**: Default 8 rounds (4 minutes total)
- **Intensity**: Maximum effort during work periods
- **Origin**: Developed by Dr. Izumi Tabata for Olympic speedskaters
- **Benefits**: Improved aerobic and anaerobic capacity

#### EMOM (Every Minute on the Minute)
- **Structure**: 60-second rounds with work/rest within each minute
- **Flexibility**: Complete prescribed reps, rest for remainder of minute
- **Rounds**: Customizable number of minutes/rounds
- **Benefits**: Consistent pacing, volume accumulation, skill development

### Visual Feedback
- **Square Progress Bar**: Shows current round progress
- **Round Counter**: Displays current round and total rounds
- **Phase Indicators**: Clear WORK/REST labels with color coding
- **Overall Progress**: Secondary indicator for total workout completion
- **Time Display**: Large, readable countdown timer

### Workout Features
- **Preparation Phase**:
  - Configurable 3-20 second countdown before workout
  - Allows time to get into position
- **Round Management**:
  - Current round / Total rounds display
  - Automatic progression through rounds
  - Visual and audio cues for phase transitions
- **Audio Cues**:
  - Distinct sounds for work phase start
  - Different sound for rest phase start
  - Completion celebration sound
- **Background Music**:
  - High-energy BGM for work phases
  - Calmer BGM for rest phases
  - Automatic switching based on phase

### Training Applications
- **HIIT Workouts**: Bodyweight exercises, sprints, cycling
- **Strength Training**: Timed sets with rest periods
- **Circuit Training**: Multiple exercise stations
- **Sports Conditioning**: Sport-specific interval training
- **Rehabilitation**: Controlled work/rest ratios for recovery
- **Group Fitness**: Synchronized timing for class workouts

---

## Technical Features

### Performance
- **Efficient Rendering**: React-based with optimized re-renders
- **Accurate Timing**: RequestAnimationFrame-based timer for precision
- **Battery Friendly**: Wake lock only active during running timers
- **Lightweight**: Minimal resource usage, works on low-end devices

### User Experience
- **Instant Feedback**: Immediate response to user interactions
- **Error Prevention**: Input validation and sensible defaults
- **Accessibility**: Keyboard navigation and ARIA labels
- **Cross-Browser**: Compatible with modern browsers
- **PWA Ready**: Can be installed as a Progressive Web App

### Data Privacy
- **Local Storage Only**: All data stored locally on user's device
- **No Account Required**: Full functionality without registration
- **No Tracking**: No analytics or user tracking
- **Export/Import**: Settings can be backed up and restored

### Customization
- **Sound Library**: Multiple built-in sounds to choose from
- **Volume Control**: Independent volume for sounds and BGM
- **Visual Themes**: Optimized for both light and dark environments
- **Flexible Settings**: Granular control over all timer parameters

---

## Best Practices

### For Productivity (Pomodoro)
1. Start with standard 25/5 timing and adjust based on your focus capacity
2. Use the todo list to maintain clear session objectives
3. Respect the breaks - step away from your workspace
4. Track daily statistics to understand your productivity patterns

### For Wellness (Breathing)
1. Practice in a quiet, comfortable environment
2. Start with shorter sessions (1-5 minutes) and gradually increase
3. Use before stressful events or as a daily meditation practice
4. Combine with the Pomodoro timer breaks for micro-recovery

### For Fitness (Interval)
1. Always warm up before high-intensity intervals
2. Choose appropriate work/rest ratios for your fitness level
3. Use BGM to maintain motivation during work phases
4. Track rounds completed to monitor progression over time

---

## Keyboard Shortcuts

- **Space/Enter**: Start/Pause timer
- **Escape**: Exit fullscreen mode
- **Tab**: Navigate between controls
- **Arrow Keys**: Adjust values in settings (when focused)

---

## Browser Compatibility

### Fully Supported
- Chrome/Chromium (v90+)
- Firefox (v88+)
- Safari (v14+)
- Edge (v90+)

### Features Requiring Permissions
- **Notifications**: Requires user permission grant
- **Audio**: Requires user interaction to unlock
- **Wake Lock**: Requires HTTPS connection
- **Fullscreen**: Requires user-initiated action

---

## Troubleshooting

### Common Issues

#### No Sound Playing
- Check browser audio permissions
- Ensure device is not muted
- Click any button to unlock audio context
- Verify sound files are enabled in settings

#### Screen Turns Off During Timer
- Enable Wake Lock in settings
- Check browser supports Wake Lock API
- Ensure using HTTPS connection
- Keep browser tab active

#### Notifications Not Showing
- Grant notification permission when prompted
- Check browser notification settings
- Ensure browser supports Notification API
- Verify notifications enabled in timer settings

#### Settings Not Saving
- Enable cookies/local storage in browser
- Check browser private/incognito mode restrictions
- Clear browser cache if settings corrupted
- Export settings before browser data clear

---

## Future Enhancements

### Planned Features
- Cloud sync for settings and statistics
- Custom sound upload capability
- Advanced statistics and analytics
- Social features for accountability
- Integration with fitness trackers
- Custom breathing pattern creation
- Workout plan templates
- Multi-timer sequences

### Community Requests
- Apple Watch / WearOS apps
- Spotify/Apple Music integration
- Voice commands and audio feedback
- AI-powered workout recommendations
- Meditation guidance integration
- Calendar integration for time blocking

---

## Support

For issues, feature requests, or contributions, please visit the [DayRamp GitHub repository](https://github.com/your-repo/dayramp).

## License

DayRamp is open-source software. See LICENSE file for details.